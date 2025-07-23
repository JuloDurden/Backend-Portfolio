// src/routes/userRoutes.js - MODIFICATION TEMPORAIRE
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// GET /api/user - Récupérer les infos utilisateur (PUBLIC)
router.get('/', userController.getUser);

// POST /api/user - Créer un utilisateur (PORTÉGÉ)
router.post('/', protect, userController.createUser)

// PUT /api/user - Modifier l'utilisateur (PROTÉGÉ)
router.put('/', protect, userController.updateUser);

module.exports = router;
