const express = require('express');
const {
  getProjects,
  getProjectsByCategory,
  getProjectById,
  getFeaturedProjects,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

// 🔗 IMPORT DU MIDDLEWARE D'UPLOAD
const { uploadProjectImages } = require('../middleware/uploadProject');

const router = express.Router();

// Routes publiques
router.get('/', getProjects);
router.get('/featured', getFeaturedProjects);
router.get('/category/:category', getProjectsByCategory);
router.get('/:id', getProjectById);

// Routes de debug (temporaires)
router.get('/debug', debugProjects);
router.delete('/cleanup', cleanupProjects);


// Routes privées (Admin) - AVEC UPLOAD MIDDLEWARE
router.post('/', uploadProjectImages, createProject);
router.put('/:id', uploadProjectImages, updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
