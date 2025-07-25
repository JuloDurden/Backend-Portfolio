const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const uploadAvatar = require('../middleware/uploadAvatar');

// Routes existantes
router.get('/', userController.getUser);
router.post('/', protect, userController.createUser);
router.put('/', protect, userController.updateUser);
router.patch('/avatar', protect, uploadAvatar, userController.updateAvatar);

// 🆕 Nouvelles routes spécifiques
router.put('/personal', protect, userController.updatePersonalData);
router.put('/about', protect, userController.updateAboutData);

module.exports = router;
