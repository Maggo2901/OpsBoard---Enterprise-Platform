const db = require('../db');

exports.getAllUsers = (req, res) => {
    const users = db.prepare('SELECT * FROM users ORDER BY name ASC').all();
    res.json(users);
};

exports.createUser = (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    try {
        const stmt = db.prepare('INSERT INTO users (name) VALUES (?)');
        const info = stmt.run(name);
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
        res.status(201).json(user);
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'User already exists' });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.deleteUser = (req, res) => {
    const { id } = req.params;
    try {
        const stmt = db.prepare('DELETE FROM users WHERE id = ?');
        const info = stmt.run(id);
        if (info.changes === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
