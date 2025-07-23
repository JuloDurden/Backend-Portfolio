const Project = require('../models/Project');

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
    const project = await Project.create(req.body);
    
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
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
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

module.exports = {
  getProjects,
  getProjectsByCategory,
  getProjectById,
  getFeaturedProjects,
  createProject,
  updateProject,
  deleteProject
};
