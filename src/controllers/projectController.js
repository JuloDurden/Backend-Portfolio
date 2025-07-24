const Project = require('../models/Project');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Récupérer tous les projets
 * @route   GET /api/projects
 * @access  Public
 */
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des projets',
      error: error.message
    });
  }
};

/**
 * @desc    Récupérer les projets par catégorie
 * @route   GET /api/projects/category/:category
 * @access  Public
 */
const getProjectsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const projects = await Project.find({ category }).sort({ createdAt: -1 });
    
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Aucun projet trouvé pour la catégorie: ${category}`
      });
    }
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des projets',
      error: error.message
    });
  }
};

/**
 * @desc    Récupérer un projet par ID
 * @route   GET /api/projects/:id
 * @access  Public
 */
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du projet',
      error: error.message
    });
  }
};

/**
 * @desc    Récupérer les projets en vedette
 * @route   GET /api/projects/featured
 * @access  Public
 */
const getFeaturedProjects = async (req, res) => {
  try {
    const projects = await Project.find({ featured: true }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des projets en vedette',
      error: error.message
    });
  }
};

/**
 * @desc    Créer un nouveau projet
 * @route   POST /api/projects
 * @access  Private (Admin)
 */
const createProject = async (req, res) => {
  try {
    // 🔧 NOUVEAU : Récupération des chemins d'images depuis req.files
    const projectData = { ...req.body };
    
    // Si des fichiers ont été uploadés, on récupère leurs chemins
    if (req.uploadedFiles) {
      const { covers, pictures } = req.uploadedFiles;
      
      // Structure des covers (small/large)
      if (covers && covers.length >= 2) {
        projectData.cover = {
          small: covers.find(f => f.includes('_400')),
          large: covers.find(f => f.includes('_1000'))
        };
      }
      
      // Array des pictures
      if (pictures && pictures.length > 0) {
        projectData.pictures = pictures;
      }
    }
    
    const project = await Project.create(projectData);
    
    res.status(201).json({
      success: true,
      message: 'Projet créé avec succès',
      data: project
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création du projet',
      error: error.message
    });
  }
};

/**
 * @desc    Modifier un projet
 * @route   PUT /api/projects/:id
 * @access  Private (Admin)
 */
const updateProject = async (req, res) => {
  try {
    // 🔧 NOUVEAU : Gestion des nouvelles images uploadées
    const updateData = { ...req.body };
    
    // Si de nouvelles images ont été uploadées
    if (req.uploadedFiles) {
      const { covers, pictures } = req.uploadedFiles;
      
      // 🗑️ Supprimer les anciennes images si nécessaire
      const existingProject = await Project.findById(req.params.id);
      if (existingProject) {
        // Supprimer anciennes covers
        if (covers && covers.length >= 2) {
          if (existingProject.cover.small) deleteFile(existingProject.cover.small);
          if (existingProject.cover.large) deleteFile(existingProject.cover.large);
          
          updateData.cover = {
            small: covers.find(f => f.includes('_400')),
            large: covers.find(f => f.includes('_1000'))
          };
        }
        
        // Supprimer anciennes pictures
        if (pictures && pictures.length > 0) {
          existingProject.pictures.forEach(pic => deleteFile(pic));
          updateData.pictures = pictures;
        }
      }
    }
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Projet mis à jour avec succès',
      data: project
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour du projet',
      error: error.message
    });
  }
};

/**
 * @desc    Supprimer un projet
 * @route   DELETE /api/projects/:id
 * @access  Private (Admin)
 */
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }
    
    // 🗑️ NOUVEAU : Supprimer les fichiers images associés
    if (project.cover) {
      if (project.cover.small) deleteFile(project.cover.small);
      if (project.cover.large) deleteFile(project.cover.large);
    }
    
    if (project.pictures && project.pictures.length > 0) {
      project.pictures.forEach(pic => deleteFile(pic));
    }
    
    await Project.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Projet supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du projet',
      error: error.message
    });
  }
};

/**
 * 🛠️ FONCTION UTILITAIRE : Supprimer un fichier
 */
const deleteFile = (filePath) => {
  try {
    const fullPath = path.join(__dirname, '..', 'public', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error);
  }
};

module.exports = {
  getProjects,
  getProjectsByCategory,
  getProjectById,
  getFeaturedProjects,
  createProject,
  updateProject,
  deleteProject
};
