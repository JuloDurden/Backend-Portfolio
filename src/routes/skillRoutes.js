const express = require('express');
const {
  getSkills,
  getSkillsByCategory,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill
} = require('../controllers/skillController');

const router = express.Router();

// Routes publiques
router.get('/', getSkills);
router.get('/category/:category', getSkillsByCategory);
router.get('/:id', getSkillById);

// Routes privées (Admin)
router.post('/', createSkill);
router.put('/:id', updateSkill);
router.delete('/:id', deleteSkill);

module.exports = router;
