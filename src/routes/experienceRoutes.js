const express = require('express');
const router = express.Router();
const experienceController = require('../controllers/experienceController');
const { uploadSingle, processExperienceImage } = require('../middleware/uploadExperience');

// GET /api/experiences - Récupérer toutes les expériences (PUBLIC)
router.get('/', experienceController.getAllExperiences);

// GET /api/experiences/:id - Récupérer une expérience (PUBLIC)
router.get('/:id', experienceController.getExperienceById);

// POST /api/experiences - Créer une expérience avec photo (PROTÉGÉ)
router.post('/', 
  uploadSingle,
  processExperienceImage,
  experienceController.createExperience
);

// PUT /api/experiences/:id - Modifier une expérience avec photo (PROTÉGÉ)
router.put('/:id', 
  uploadSingle,
  processExperienceImage,
  experienceController.updateExperience
);

// DELETE /api/experiences/:id - Supprimer une expérience (PROTÉGÉ)
router.delete('/:id', experienceController.deleteExperience);

module.exports = router;
