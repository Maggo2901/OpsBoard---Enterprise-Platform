const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/database.sqlite');
const db = new Database(dbPath);

const id = 63;

try {
    console.log('Query 1: SELECT * FROM attachments WHERE task_id = ?');
    db.prepare('SELECT * FROM attachments WHERE task_id = ?').all(id);
    console.log('Query 1 Success');

    console.log('Query 2: SELECT * FROM attachments WHERE deleted_at IS NULL');
    db.prepare('SELECT * FROM attachments WHERE deleted_at IS NULL').all();
    console.log('Query 2 Success');

    console.log('Query 3: SELECT * FROM attachments WHERE deleted_at = ""');
    db.prepare('SELECT * FROM attachments WHERE deleted_at = ""').all();
    console.log('Query 3 Success');

} catch (err) {
    console.error('ERROR:', err.message);
} finally {
    db.close();
}
