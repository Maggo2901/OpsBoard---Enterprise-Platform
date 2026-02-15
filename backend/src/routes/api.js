const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

const userController = require('../controllers/userController');
const boardController = require('../controllers/boardController');
const taskController = require('../controllers/taskController');

// Users
router.get('/users', userController.getAllUsers);
router.post('/users', userController.createUser);
router.delete('/users/:id', userController.deleteUser);

// Boards
router.get('/boards', boardController.getAllBoards);
router.post('/boards', boardController.createBoard);
router.delete('/boards/:id', boardController.deleteBoard);
router.put('/boards/:id', boardController.renameBoard);
router.get('/boards/:id', boardController.getBoardDetails);

// Columns
router.post('/columns', boardController.createColumn);
router.put('/columns/:id', boardController.updateColumn);
router.delete('/columns/:id', boardController.deleteColumn);
router.post('/columns/reorder', boardController.reorderColumns); // Batch reorder

// Tasks
router.post('/tasks', taskController.createTask);
router.put('/tasks/:id', taskController.updateTask);
router.delete('/tasks/:id', taskController.deleteTask);
router.get('/tasks/:id', taskController.getTaskDetails);
router.patch('/tasks/:id/move', taskController.moveTask); // Drag and drop move
router.patch('/tasks/:id/archive', taskController.archiveTask);
router.patch('/tasks/:id/restore', taskController.restoreTask);
router.get('/archived-tasks', taskController.getArchivedTasks);

// Labels
router.get('/labels', taskController.getLabels);
router.post('/labels', taskController.createLabel);
router.delete('/labels/:id', taskController.deleteLabel);
router.post('/tasks/:id/labels', taskController.addTaskLabel);
router.delete('/tasks/:id/labels/:labelId', taskController.removeTaskLabel);

// Attachments
router.post('/tasks/:id/attachments', upload.single('file'), taskController.uploadAttachment);
router.delete('/tasks/:id/attachments/:attachmentId', taskController.deleteAttachment);

module.exports = router;
