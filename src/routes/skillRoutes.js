const express = require('express');
const uploadSkill = require('../middleware/uploadSkill');
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

// Routes privées (Admin) - avec upload optionnel
router.post('/', uploadSkill.single('icon'), createSkill);
router.put('/:id', uploadSkill.single('icon'), updateSkill);
router.delete('/:id', deleteSkill);

module.exports = router;
