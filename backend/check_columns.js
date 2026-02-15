const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/database.sqlite');
const db = new Database(dbPath);

try {
    const row = db.prepare('SELECT * FROM attachments LIMIT 1').get();
    if (row) {
        console.log('Columns found in row:', Object.keys(row));
    } else {
        console.log('No rows in attachments table to check columns.');
    }
} catch (err) {
    console.error('ERROR:', err.message);
} finally {
    db.close();
}
