const express = require('express');
const router = express.Router();
const experienceController = require('../controllers/experienceController');

// GET /api/experiences - Récupérer toutes les expériences (PUBLIC)
router.get('/', experienceController.getAllExperiences);

// GET /api/experiences/:id - Récupérer une expérience (PUBLIC)
router.get('/:id', experienceController.getExperienceById);

// POST /api/experiences - Créer une expérience (PROTÉGÉ - à implémenter)
router.post('/', experienceController.createExperience);

// PUT /api/experiences/:id - Modifier une expérience (PROTÉGÉ - à implémenter)
router.put('/:id', experienceController.updateExperience);

// DELETE /api/experiences/:id - Supprimer une expérience (PROTÉGÉ - à implémenter)
router.delete('/:id', experienceController.deleteExperience);

module.exports = router;
