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

const router = express.Router();

// Routes publiques
router.get('/', getProjects);
router.get('/featured', getFeaturedProjects);
router.get('/category/:category', getProjectsByCategory);
router.get('/:id', getProjectById);

// Routes privées (Admin)
router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
