// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// POST /api/auth/login - Connexion
router.post('/login', authController.login);

// GET /api/auth/me - Profil utilisateur connecté
router.get('/me', protect, authController.getMe);

// POST /api/auth/logout - Déconnexion
router.post('/logout', authController.logout);

module.exports = router;
