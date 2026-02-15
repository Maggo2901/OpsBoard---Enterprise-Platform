const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

// Main uploads directory
const baseUploadDir = process.env.UPLOADS_PATH || path.join(__dirname, '../../data/uploads');

// Helper to sanitize folder names
const sanitizeName = (name) => {
    return name.replace(/[^a-z0-9_-]/gi, '_').substring(0, 50);
};

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const taskId = req.params.id;
        let finalDir = baseUploadDir;

        if (taskId) {
            try {
                const task = db.prepare('SELECT title FROM tasks WHERE id = ?').get(taskId);
                if (task) {
                    const folderName = `${taskId}_${sanitizeName(task.title)}`;
                    finalDir = path.join(baseUploadDir, folderName);
                }
            } catch (err) {
                console.error('Error fetching task for upload path:', err.message);
            }
        }

        if (!fs.existsSync(finalDir)) {
            fs.mkdirSync(finalDir, { recursive: true });
        }
        cb(null, finalDir);
    },
    filename: (req, file, cb) => {
        const originalName = file.originalname;
        const ext = path.extname(originalName);
        const base = path.basename(originalName, ext);
        
        let finalName = originalName;
        let counter = 1;
        
        // Use the destination directory from req (Multer sets this after calling destination)
        // Since we can't easily access the finalDir here without recalculating or relying on Multer internals,
        // we recalculate the path. Note: Multer calls destination first.
        
        const taskId = req.params.id;
        let destDir = baseUploadDir;
        if (taskId) {
            const task = db.prepare('SELECT title FROM tasks WHERE id = ?').get(taskId);
            if (task) {
                destDir = path.join(baseUploadDir, `${taskId}_${sanitizeName(task.title)}`);
            }
        }

        while (fs.existsSync(path.join(destDir, finalName))) {
            finalName = `${base}_${counter.toString().padStart(2, '0')}${ext}`;
            counter++;
        }
        
        cb(null, finalName);
    }
});

// Initialize multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

module.exports = upload;
