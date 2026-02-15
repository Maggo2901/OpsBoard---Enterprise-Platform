const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/database.sqlite');
const db = new Database(dbPath);

const id = 63;

try {
    console.log('Querying task...');
    const task = db.prepare(`
        SELECT t.*, u.name as creator_name, c.name as column_name
        FROM tasks t
        LEFT JOIN users u ON t.created_by = u.id
        LEFT JOIN columns c ON t.column_id = c.id
        WHERE t.id = ?
    `).get(id);
    console.log('Task found');

    console.log('Querying labels...');
    db.prepare(`
        SELECT l.* FROM labels l
        JOIN task_labels tl ON l.id = tl.label_id
        WHERE tl.task_id = ?
    `).all(id);
    console.log('Labels found');

    console.log('Querying attachments...');
    db.prepare('SELECT * FROM attachments WHERE task_id = ? AND (deleted_at IS NULL OR deleted_at = \'\')').all(id);
    console.log('Attachments found');
    
    console.log('Querying pending_deletion...');
    db.prepare('SELECT * FROM attachments WHERE task_id = ? AND deleted_at IS NOT NULL AND deleted_at != \'\'').all(id);
    console.log('Pending Deletion found');

    console.log('Querying activities...');
    db.prepare(`
        SELECT a.*, u.name as user_name 
        FROM activity_logs a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.task_id = ?
        ORDER BY a.created_at DESC
    `).all(id);
    console.log('Activities found');

} catch (err) {
    console.error('ERROR AT STEP:', err.message);
} finally {
    db.close();
}
