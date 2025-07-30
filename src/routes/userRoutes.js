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
router.post('/avatar', protect, uploadAvatar, userController.updateAvatar);

// 🎛️ Routes spécifiques
router.put('/personal-data', protect, userController.updatePersonalData);
router.put('/about', protect, userController.updateAboutData);

// 🔐 Changement de mot de passe
router.put('/change-password', protect, userController.changePassword);

module.exports = router;
