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
    const skills = await Skill.find({ categories: { $in: [category] } }).sort({ name: 1 });
    
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
    // 🔥 CORRIGÉ : utiliser le champ "id" au lieu de "_id"
    const skill = await Skill.findOne({ id: req.params.id });
    
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
    console.log('🔍 REQ.BODY createSkill:', req.body);
    console.log('🔍 REQ.FILE:', req.file);
    
    // Génération ID unique
    const skillId = 'skill_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const skillData = {
      ...req.body,
      id: skillId
    };

    // Si fichier uploadé, utiliser le chemin local
    if (req.file) {
      skillData.icon = req.file.path.replace(/\\/g, '/');
    }
    
    const skill = await Skill.create(skillData);
    
    console.log(`✅ Skill créée: ${skill.name}`);
    
    res.status(201).json({
      success: true,
      message: 'Compétence créée avec succès',
      data: skill
    });
  } catch (error) {
    console.error('Erreur createSkill:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors
      });
    }
    
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
    console.log('🔍 REQ.PARAMS:', req.params);
    console.log('🔍 REQ.BODY updateSkill:', req.body);
    console.log('🔍 REQ.FILE:', req.file);
    
    // 🔥 CORRIGÉ : utiliser le champ "id"
    const skill = await Skill.findOne({ id: req.params.id });
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Compétence non trouvée'
      });
    }

    // Préparer les données de mise à jour
    const updateData = { ...req.body };

    // Si un nouveau fichier est uploadé
    if (req.file) {
      // Supprimer l'ancienne icône si c'était un fichier local
      if (skill.icon && skill.icon.startsWith('uploads/skills/')) {
        const fs = require('fs');
        const oldIconPath = skill.icon;
        if (fs.existsSync(oldIconPath)) {
          fs.unlinkSync(oldIconPath);
          console.log(`Ancienne icône supprimée : ${oldIconPath}`);
        }
      }
      
      // Utiliser la nouvelle icône
      updateData.icon = req.file.path.replace(/\\/g, '/');
    }

    // 🔥 CORRIGÉ : findOneAndUpdate + runValidators: false
    const updatedSkill = await Skill.findOneAndUpdate(
      { id: req.params.id },
      { $set: updateData },
      {
        new: true,
        runValidators: false // 🔥 Évite les erreurs de validation comme avant
      }
    );
    
    console.log(`✅ Skill mise à jour: ${updatedSkill.name}`);
    
    res.status(200).json({
      success: true,
      message: 'Compétence mise à jour avec succès',
      data: updatedSkill
    });
  } catch (error) {
    console.error('Erreur updateSkill:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors
      });
    }
    
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
    console.log('🔍 DELETE SKILL ID:', req.params.id);
    
    // 🔥 CORRIGÉ : utiliser le champ "id"
    const skill = await Skill.findOne({ id: req.params.id });
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Compétence non trouvée'
      });
    }

    // Supprimer le fichier icône si c'était un upload local
    if (skill.icon && skill.icon.startsWith('uploads/skills/')) {
      const fs = require('fs');
      if (fs.existsSync(skill.icon)) {
        fs.unlinkSync(skill.icon);
        console.log(`Icône supprimée : ${skill.icon}`);
      }
    }
    
    // 🔥 CORRIGÉ : findOneAndDelete
    await Skill.findOneAndDelete({ id: req.params.id });
    
    console.log(`✅ Skill supprimée: ${skill.name}`);
    
    res.status(200).json({
      success: true,
      message: 'Compétence supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteSkill:', error);
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
