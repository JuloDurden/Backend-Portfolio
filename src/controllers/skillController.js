const Skill = require('../models/Skill');

/**
 * @desc    Récupérer toutes les compétences (avec filtres optionnels)
 * @route   GET /api/skills
 * @route   GET /api/skills?categories=Design
 * @route   GET /api/skills?level=Senior&featured=true
 * @access  Public
 */
const getSkills = async (req, res) => {
  try {
    let filter = {};

    // Filtre par catégories (dans un array)
    if (req.query.categories) {
      const categoriesArray = req.query.categories.split(',');
      filter.categories = { $in: categoriesArray };
    }

    // Filtre par niveau
    if (req.query.level) {
      filter.level = req.query.level;
    }

    // Filtre par featured
    if (req.query.featured !== undefined) {
      filter.featured = req.query.featured === 'true';
    }

    // Filtre par visibilité (par défaut visible uniquement)
    if (req.query.isVisible !== undefined) {
      filter.isVisible = req.query.isVisible === 'true';
    } else {
      filter.isVisible = true; // Par défaut, seulement les visibles
    }

    console.log("Filter appliqué:", filter); // DEBUG

    const skills = await Skill.find(filter).sort({ order: 1, name: 1 });
    
    res.status(200).json({
      success: true,
      count: skills.length,
      data: skills
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des compétences',
      error: error.message
    });
  }
};


/**
 * @desc    Récupérer les compétences par catégorie
 * @route   GET /api/skills/category/:category
 * @access  Public
 */
const getSkillsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const skills = await Skill.find({ category }).sort({ name: 1 });
    
    if (skills.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Aucune compétence trouvée pour la catégorie: ${category}`
      });
    }
    
    res.status(200).json({
      success: true,
      count: skills.length,
      data: skills
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des compétences',
      error: error.message
    });
  }
};

/**
 * @desc    Récupérer une compétence par ID
 * @route   GET /api/skills/:id
 * @access  Public
 */
const getSkillById = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Compétence non trouvée'
      });
    }
    
    res.status(200).json({
      success: true,
      data: skill
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la compétence',
      error: error.message
    });
  }
};

/**
 * @desc    Créer une nouvelle compétence
 * @route   POST /api/skills
 * @access  Private (Admin)
 */
const createSkill = async (req, res) => {
  try {
    const skill = await Skill.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Compétence créée avec succès',
      data: skill
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création de la compétence',
      error: error.message
    });
  }
};

/**
 * @desc    Modifier une compétence
 * @route   PUT /api/skills/:id
 * @access  Private (Admin)
 */
const updateSkill = async (req, res) => {
  try {
    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Compétence non trouvée'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Compétence mise à jour avec succès',
      data: skill
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la compétence',
      error: error.message
    });
  }
};

/**
 * @desc    Supprimer une compétence
 * @route   DELETE /api/skills/:id
 * @access  Private (Admin)
 */
const deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Compétence non trouvée'
      });
    }
    
    await Skill.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Compétence supprimée avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la compétence',
      error: error.message
    });
  }
};

module.exports = {
  getSkills,
  getSkillsByCategory,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill
};
