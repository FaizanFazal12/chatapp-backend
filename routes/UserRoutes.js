const express = require('express');
const UserController = require('../controller/UserController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', UserController.createUser);
router.post('/login', UserController.loginUser);
router.get('/me', auth, UserController.getMe);
// Private routes
router.get('/users', auth, UserController.getUsers);
router.get('/user/:id', auth, UserController.getUserById);
router.put('/users/:id', auth, UserController.updateUser);
router.delete('/users/:id', auth, UserController.deleteUser);
router.post('/logout', UserController.logoutUser);

module.exports = router;