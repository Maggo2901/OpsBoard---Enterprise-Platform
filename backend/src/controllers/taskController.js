const db = require('../db');
const path = require('path');

// Helper to log activity
const logActivity = (taskId, action, userId, details = null) => {
    try {
        const stmt = db.prepare('INSERT INTO activity_logs (task_id, action, user_id, details) VALUES (?, ?, ?, ?)');
        stmt.run(taskId, action, userId, details);
    } catch (error) {
        console.error('Failed to log activity:', error.message);
    }
};

// Common error handler for sync DB ops
const handleDbError = (res, err) => {
    console.error(err);
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return res.status(400).json({ success: false, message: 'Invalid reference (e.g. column or board does not exist)' });
    }
    if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
        return res.status(400).json({ success: false, message: 'Invalid data format (e.g. priority)' });
    }
    res.status(500).json({ success: false, message: 'Database error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
};

// --- TASKS ---

exports.createTask = (req, res) => {
    const { title, description, due_date, priority, column_id, board_id, created_by } = req.body;
    
    // Input Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!column_id || isNaN(column_id)) {
        return res.status(400).json({ success: false, message: 'Valid column_id is required' });
    }
    if (!board_id || isNaN(board_id)) {
        return res.status(400).json({ success: false, message: 'Valid board_id is required' });
    }
    if (priority && !['Low', 'Medium', 'High'].includes(priority)) {
        return res.status(400).json({ success: false, message: 'Invalid priority' });
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO tasks (title, description, due_date, priority, column_id, board_id, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        const info = stmt.run(title, description, due_date, priority, column_id, board_id, created_by);
        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
        
        logActivity(task.id, 'created', created_by);
        
        res.status(201).json(task);
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.updateTask = (req, res) => {
    const { id } = req.params;
    const { title, description, due_date, priority, column_id, user_id } = req.body;

    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid task ID' });

    try {
        const stmt = db.prepare(`
            UPDATE tasks 
            SET title = ?, description = ?, due_date = ?, priority = ?, column_id = COALESCE(?, column_id), updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        
        const result = stmt.run(title, description, due_date, priority, column_id, id);
        
        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        logActivity(id, 'updated', user_id);
        
        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
        res.json(task);
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.moveTask = (req, res) => {
    const { id } = req.params;
    const { column_id, user_id } = req.body;
    
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid task ID' });
    if (!column_id || isNaN(column_id)) return res.status(400).json({ success: false, message: 'Valid column_id required' });

    try {
        const oldTask = db.prepare('SELECT column_id FROM tasks WHERE id = ?').get(id);
        if (!oldTask) return res.status(404).json({ success: false, message: 'Task not found' });

        db.prepare('UPDATE tasks SET column_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(column_id, id);
        
        if (oldTask.column_id !== column_id) {
            const oldCol = db.prepare('SELECT name FROM columns WHERE id = ?').get(oldTask.column_id);
            const newCol = db.prepare('SELECT name FROM columns WHERE id = ?').get(column_id);
            const details = `Moved from ${oldCol?.name || 'Unknown'} to ${newCol?.name || 'Unknown'}`;
            logActivity(id, 'moved', user_id, details);
        }
        
        res.json({ success: true, message: 'Task moved' });
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.archiveTask = (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid task ID' });

    try {
        const result = db.prepare('UPDATE tasks SET archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
        if (result.changes === 0) return res.status(404).json({ success: false, message: 'Task not found' });

        logActivity(id, 'archived', user_id);
        res.json({ success: true, message: 'Task archived' });
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.deleteTask = (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid task ID' });

    try {
        // 1. Get task title to find folder before deleting from DB
        const task = db.prepare('SELECT title FROM tasks WHERE id = ?').get(id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        // 2. Delete from DB (FK ON DELETE CASCADE will handle attachments table)
        const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
        
        // 3. Delete task folder if it exists
        if (result.changes > 0) {
            const fs = require('fs');
            const path = require('path');
            const baseUploadDir = process.env.UPLOADS_PATH || path.join(__dirname, '../../data/uploads');
            
            // Helper to sanitize (must match upload.js)
            const sanitizeName = (name) => name.replace(/[^a-z0-9_-]/gi, '_').substring(0, 50);
            const folderName = `${id}_${sanitizeName(task.title)}`;
            const taskDir = path.join(baseUploadDir, folderName);
            
            if (fs.existsSync(taskDir)) {
                try {
                    fs.rmSync(taskDir, { recursive: true, force: true });
                } catch (rmErr) {
                    console.error(`Failed to delete task folder ${taskDir}:`, rmErr.message);
                }
            }
        }
        
        res.json({ success: true, message: 'Task and associated files deleted' });
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.getTaskDetails = (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid task ID' });

    try {
        const task = db.prepare(`
            SELECT t.*, u.name as creator_name, c.name as column_name
            FROM tasks t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN columns c ON t.column_id = c.id
            WHERE t.id = ?
        `).get(id);

        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        task.labels = db.prepare(`
            SELECT l.* FROM labels l
            JOIN task_labels tl ON l.id = tl.label_id
            WHERE tl.task_id = ?
        `).all(id);

        task.attachments = db.prepare('SELECT * FROM attachments WHERE task_id = ? AND (deleted_at IS NULL OR deleted_at = \'\')').all(id);
        
        task.pending_deletion = db.prepare('SELECT * FROM attachments WHERE task_id = ? AND deleted_at IS NOT NULL AND deleted_at != \'\'').all(id);

        task.activities = db.prepare(`
            SELECT a.*, u.name as user_name 
            FROM activity_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.task_id = ?
            ORDER BY a.created_at DESC
        `).all(id);

        res.json(task);
    } catch (err) {
        handleDbError(res, err);
    }
};

// --- LABELS ---

exports.getLabels = (req, res) => {
    try {
        const labels = db.prepare('SELECT * FROM labels ORDER BY id ASC').all();
        res.json(labels);
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.createLabel = (req, res) => {
    const { name, color } = req.body;
    if (!name || !color) return res.status(400).json({ success: false, message: 'Name and color required' });
    
    try {
        const stmt = db.prepare('INSERT INTO labels (name, color) VALUES (?, ?)');
        const info = stmt.run(name, color);
        const label = db.prepare('SELECT * FROM labels WHERE id = ?').get(info.lastInsertRowid);
        res.status(201).json(label);
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.deleteLabel = (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid label ID' });

    try {
        db.prepare('DELETE FROM labels WHERE id = ?').run(id);
        res.json({ success: true, message: 'Label deleted' });
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.addTaskLabel = (req, res) => {
    const { id } = req.params;
    const { label_id } = req.body;
    
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid task ID' });
    if (!label_id || isNaN(label_id)) return res.status(400).json({ success: false, message: 'Invalid label ID' });

    try {
        db.prepare('INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)').run(id, label_id);
        res.json({ success: true, message: 'Label added' });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
            return res.status(400).json({ success: false, message: 'Label already added to task' });
        }
        handleDbError(res, err);
    }
};

exports.removeTaskLabel = (req, res) => {
    const { id, labelId } = req.params;
    
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid task ID' });
    if (!labelId || isNaN(labelId)) return res.status(400).json({ success: false, message: 'Invalid label ID' });

    try {
        db.prepare('DELETE FROM task_labels WHERE task_id = ? AND label_id = ?').run(id, labelId);
        res.json({ success: true, message: 'Label removed' });
    } catch (err) {
        handleDbError(res, err);
    }
};

// --- ATTACHMENTS ---

exports.uploadAttachment = (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid task ID' });
    
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded or file rejected' });

    try {
        const { filename, originalname, path: filePath } = req.file;

        const stmt = db.prepare('INSERT INTO attachments (task_id, filename, original_name, path) VALUES (?, ?, ?, ?)');
        stmt.run(id, filename, originalname, filePath);
        
        // Log upload (assuming user_id coming in body or default to system)
        const user_id = req.body.user_id || null;
        logActivity(id, 'attachment_added', user_id, `Uploaded ${originalname}`);

        res.json({ success: true, message: 'File uploaded', file: req.file });
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.deleteAttachment = (req, res) => {
    const { id, attachmentId } = req.params;
    const { user_id } = req.body;

    if (!attachmentId || isNaN(attachmentId)) return res.status(400).json({ success: false, message: 'Invalid attachment ID' });

    try {
        const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(attachmentId);
        if (!attachment) return res.status(404).json({ success: false, message: 'Attachment not found' });

        // If already soft-deleted, perform permanent delete
        if (attachment.deleted_at) {
            try {
                const fs = require('fs');
                if (fs.existsSync(attachment.path)) {
                    fs.unlinkSync(attachment.path);
                }
                
                db.prepare('DELETE FROM attachments WHERE id = ?').run(attachmentId);
                logActivity(id, 'attachment_purged', user_id, `Permanently deleted ${attachment.original_name}.`);
                
                return res.json({ success: true, message: 'Attachment permanently deleted' });
            } catch (err) {
                console.error('Failed to physically delete file:', err.message);
                // Continue to delete DB record even if file is missing
                db.prepare('DELETE FROM attachments WHERE id = ?').run(attachmentId);
                return res.json({ success: true, message: 'Attachment record removed' });
            }
        }

        // Soft delete
        db.prepare('UPDATE attachments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(attachmentId);
        logActivity(id, 'attachment_deleted', user_id, `Deleted ${attachment.original_name}. Will be removed permanently in 7 days.`);

        res.json({ success: true, message: 'Attachment marked for deletion' });
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.getArchivedTasks = (req, res) => {
    const { board_id } = req.query;
    if (!board_id || isNaN(board_id)) return res.status(400).json({ success: false, message: "Valid board_id required" });

    try {
        const tasks = db.prepare(`
            SELECT t.*, u.name as assignee_name 
            FROM tasks t 
            LEFT JOIN users u ON t.created_by = u.id 
            WHERE t.board_id = ? AND t.archived = 1
            ORDER BY t.updated_at DESC
        `).all(board_id);

        res.json(tasks);
    } catch (err) {
        handleDbError(res, err);
    }
};

exports.restoreTask = (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid task ID' });

    try {
        const result = db.prepare('UPDATE tasks SET archived = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
        if (result.changes === 0) return res.status(404).json({ success: false, message: 'Task not found' });
        
        logActivity(id, 'restored', user_id);
        res.json({ success: true, message: 'Task restored' });
    } catch (err) {
        handleDbError(res, err);
    }
};
