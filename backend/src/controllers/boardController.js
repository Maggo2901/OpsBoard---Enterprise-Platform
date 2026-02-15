const db = require('../db');

const handleDbError = (res, err) => {
    console.error(err);
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return res.status(400).json({ success: false, message: 'Invalid reference (e.g. board does not exist)' });
    }
    res.status(500).json({ success: false, message: 'Database error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
};

// --- BOARDS ---

exports.getAllBoards = (req, res) => {
    try {
        const boards = db.prepare('SELECT * FROM boards ORDER BY created_at DESC').all();
        res.json(boards);
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.createBoard = (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Board name is required' });
    }

    try {
        const stmt = db.prepare('INSERT INTO boards (name) VALUES (?)');
        const info = stmt.run(name.trim());
        
        // Create default columns
        const boardId = info.lastInsertRowid;
        const insertCol = db.prepare('INSERT INTO columns (name, board_id, position) VALUES (?, ?, ?)');
        
        const transaction = db.transaction(() => {
            insertCol.run('To Do', boardId, 0);
            insertCol.run('In Progress', boardId, 1);
            insertCol.run('Done', boardId, 2);
        });
        transaction();

        const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(boardId);
        res.status(201).json(board);
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.deleteBoard = (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid board ID' });

    try {
        const result = db.prepare('DELETE FROM boards WHERE id = ?').run(id);
        if (result.changes === 0) return res.status(404).json({ success: false, message: 'Board not found' });
        res.json({ success: true, message: 'Board deleted' });
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.renameBoard = (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid board ID' });
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Board name is required' });
    
    try {
        const result = db.prepare('UPDATE boards SET name = ? WHERE id = ?').run(name.trim(), id);
        if (result.changes === 0) return res.status(404).json({ success: false, message: 'Board not found' });
        res.json({ success: true, message: 'Board updated' });
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.getBoardDetails = (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid board ID' });

    try {
        const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(id);
        
        if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

        const columns = db.prepare('SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC').all(id);
        
        // Fetch tasks for this board
        const tasks = db.prepare(`
            SELECT t.*, u.name as assignee_name 
            FROM tasks t 
            LEFT JOIN users u ON t.created_by = u.id 
            WHERE t.board_id = ? AND t.archived = 0
        `).all(id);

        // Attach labels to tasks - using transaction for consistency and minor speedup
        // Although better approach is JOIN, keeping structure as requested
        const getLabelsStmt = db.prepare(`
            SELECT l.* FROM labels l 
            JOIN task_labels tl ON l.id = tl.label_id 
            WHERE tl.task_id = ?
        `);

        for (const task of tasks) {
            task.labels = getLabelsStmt.all(task.id);
        }

        res.json({ board, columns, tasks });
    } catch (err) {
        handleDbError(res, err);
    }
};

// --- COLUMNS ---

exports.createColumn = (req, res) => {
    const { board_id, name } = req.body;
    
    if (!board_id || isNaN(board_id)) return res.status(400).json({ success: false, message: 'Valid board_id required' });
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Column name required' });

    try {
        // Get max position
        const result = db.prepare('SELECT MAX(position) as maxPos FROM columns WHERE board_id = ?').get(board_id);
        const position = (result.maxPos !== null) ? result.maxPos + 1 : 0;

        const stmt = db.prepare('INSERT INTO columns (name, board_id, position) VALUES (?, ?, ?)');
        const info = stmt.run(name.trim(), board_id, position);
        
        const column = db.prepare('SELECT * FROM columns WHERE id = ?').get(info.lastInsertRowid);
        res.status(201).json(column);
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.updateColumn = (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid column ID' });
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Column name required' });

    try {
        const result = db.prepare('UPDATE columns SET name = ? WHERE id = ?').run(name.trim(), id);
        if (result.changes === 0) return res.status(404).json({ success: false, message: 'Column not found' });
        res.json({ success: true, message: 'Column updated' });
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.deleteColumn = (req, res) => {
    const { id } = req.params;
    const { fallback_column_id } = req.body || {};
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid column ID' });

    try {
        const targetColumn = db.prepare('SELECT id, name, board_id FROM columns WHERE id = ?').get(id);
        if (!targetColumn) return res.status(404).json({ success: false, message: 'Column not found' });

        const boardColumns = db.prepare('SELECT id, name, position FROM columns WHERE board_id = ? ORDER BY position ASC').all(targetColumn.board_id);
        if (boardColumns.length <= 1) {
            return res.status(400).json({ success: false, message: 'Cannot delete the last remaining section' });
        }

        const otherColumns = boardColumns.filter(column => Number(column.id) !== Number(id));

        let fallbackColumn = null;
        if (fallback_column_id && !isNaN(fallback_column_id) && Number(fallback_column_id) !== Number(id)) {
            fallbackColumn = otherColumns.find(column => Number(column.id) === Number(fallback_column_id)) || null;
        }

        if (!fallbackColumn) {
            fallbackColumn = otherColumns.find(column => column.name && column.name.trim().toLowerCase() === 'to do') || null;
        }
        if (!fallbackColumn) {
            fallbackColumn = otherColumns[0] || null;
        }

        if (!fallbackColumn) {
            return res.status(400).json({ success: false, message: 'No fallback section available' });
        }

        const moveTasksStmt = db.prepare('UPDATE tasks SET column_id = ?, updated_at = CURRENT_TIMESTAMP WHERE column_id = ?');
        const deleteColumnStmt = db.prepare('DELETE FROM columns WHERE id = ?');
        const reorderStmt = db.prepare('UPDATE columns SET position = ? WHERE id = ?');
        const getRemainingStmt = db.prepare('SELECT id FROM columns WHERE board_id = ? ORDER BY position ASC');

        const transaction = db.transaction(() => {
            const moved = moveTasksStmt.run(fallbackColumn.id, id);
            const deleted = deleteColumnStmt.run(id);
            if (deleted.changes === 0) throw new Error('Column deletion failed');

            const remainingColumns = getRemainingStmt.all(targetColumn.board_id);
            remainingColumns.forEach((column, index) => {
                reorderStmt.run(index, column.id);
            });

            return moved.changes;
        });

        const movedTasks = transaction();

        res.json({
            success: true,
            message: 'Section deleted and tasks reassigned',
            fallback_column_id: fallbackColumn.id,
            moved_tasks: movedTasks
        });
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.reorderColumns = (req, res) => {
    // Expects { columns: [{ id: 1, position: 0 }, { id: 2, position: 1 }] }
    const { columns } = req.body;
    
    if (!Array.isArray(columns) || columns.length === 0) {
        return res.status(400).json({ success: false, message: 'Columns array required' });
    }

    const updateStmt = db.prepare('UPDATE columns SET position = ? WHERE id = ?');
    
    try {
        const transaction = db.transaction((cols) => {
            for (const col of cols) {
                if (!col.id || col.position === undefined) throw new Error('Invalid column data');
                updateStmt.run(col.position, col.id);
            }
        });
        
        transaction(columns);
        res.json({ success: true, message: 'Columns reordered' });
    } catch (err) {
        if (err.message === 'Invalid column data') {
            return res.status(400).json({ success: false, message: 'Invalid column data structure' });
        }
        handleDbError(res, err);
    }
};
