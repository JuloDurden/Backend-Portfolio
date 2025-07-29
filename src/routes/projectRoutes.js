const express = require('express');
const {
  getProjects,
  getProjectsByCategory,
  getProjectById,
  getFeaturedProjects,
  createProject,
  updateProject,
  deleteProject,
  debugProjects,
  cleanupProjects
} = require('../controllers/projectController');

const { uploadProjectImages } = require('../middleware/uploadProject');

const router = express.Router();

// ✅ ROUTES SPÉCIFIQUES EN PREMIER (avant /:id)
router.get('/debug', debugProjects);
router.delete('/cleanup', cleanupProjects);
router.get('/featured', getFeaturedProjects);
router.get('/category/:category', getProjectsByCategory);

// ✅ ROUTES GÉNÉRIQUES EN DERNIER
router.get('/', getProjects);
router.get('/:id', getProjectById);

// Routes privées (Admin)
router.post('/', uploadProjectImages, createProject);
router.put('/:id', uploadProjectImages, updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
