const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/database.sqlite');
const db = new Database(dbPath);

try {
    const info = db.prepare("PRAGMA table_info(attachments)").all();
    console.log('Table Info:', JSON.stringify(info, null, 2));
} catch (err) {
    console.error('Error:', err.message);
} finally {
    db.close();
}
