const Project = require('../models/Project');
const { cloudinary } = require('../config/cloudinary');

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
    // 🔥 CORRECTION : Ne PAS inclure le champ 'id' du frontend
    const { id, ...bodyWithoutId } = req.body; // Destructure pour enlever 'id'
    const projectData = { ...bodyWithoutId };
    
    // Si des fichiers ont été uploadés sur Cloudinary
    if (req.uploadedFiles) {
      const { covers, pictures } = req.uploadedFiles;
      
      // Structure des covers (small/large) avec URLs Cloudinary
      if (covers && covers.small && covers.large) {
        projectData.cover = {
          small: covers.small,
          large: covers.large
        };
      }
      
      // Array des pictures avec URLs Cloudinary
      if (pictures && pictures.length > 0) {
        projectData.pictures = pictures.map(pic => pic.url);
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
    // 🔧 NOUVEAU : Gestion des nouvelles images Cloudinary
    const updateData = { ...req.body };
    
    // Si de nouvelles images ont été uploadées sur Cloudinary
    if (req.uploadedFiles) {
      const { covers, pictures } = req.uploadedFiles;
      
      // 🗑️ Supprimer les anciennes images Cloudinary si nécessaire
      const existingProject = await Project.findById(req.params.id);
      if (existingProject) {
        
        // Mise à jour des covers
        if (covers && covers.small && covers.large) {
          // Supprimer l'ancienne cover de Cloudinary (si elle existe)
          if (existingProject.cover && existingProject.cover.publicId) {
            await deleteCloudinaryImage(existingProject.cover.publicId);
          }
          
          updateData.cover = {
            small: covers.small,
            large: covers.large
          };
        }
        
        // Mise à jour des pictures
        if (pictures && pictures.length > 0) {
          // Supprimer les anciennes pictures de Cloudinary
          if (existingProject.pictures && existingProject.pictures.length > 0) {
            // Extraire les public_ids des anciennes URLs et les supprimer
            // (On fera une version simplifiée ici)
            console.log('Anciennes pictures à supprimer:', existingProject.pictures);
          }
          
          updateData.pictures = pictures.map(pic => pic.url);
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
    
    // 🗑️ NOUVEAU : Supprimer les images de Cloudinary
    try {
      // Supprimer les covers (on va extraire le public_id de l'URL)
      if (project.cover && project.cover.small) {
        const publicId = extractPublicIdFromUrl(project.cover.small);
        if (publicId) await deleteCloudinaryImage(publicId);
      }
      
      // Supprimer les pictures
      if (project.pictures && project.pictures.length > 0) {
        for (const pictureUrl of project.pictures) {
          const publicId = extractPublicIdFromUrl(pictureUrl);
          if (publicId) await deleteCloudinaryImage(publicId);
        }
      }
    } catch (cleanupError) {
      console.error('Erreur nettoyage Cloudinary:', cleanupError);
      // On continue même si le nettoyage échoue
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
 * 🛠️ FONCTION UTILITAIRE : Supprimer une image de Cloudinary
 */
const deleteCloudinaryImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Image Cloudinary supprimée: ${publicId}`);
  } catch (error) {
    console.error('Erreur suppression Cloudinary:', error);
  }
};

/**
 * 🛠️ FONCTION UTILITAIRE : Extraire public_id d'une URL Cloudinary
 */
const extractPublicIdFromUrl = (url) => {
  try {
    // Exemple URL: https://res.cloudinary.com/your-cloud/image/upload/v1234567/portfolio/projects/abc123
    const matches = url.match(/\/portfolio\/projects\/([^\/\.]+)/);
    return matches ? `portfolio/projects/${matches[1]}` : null;
  } catch (error) {
    console.error('Erreur extraction public_id:', error);
    return null;
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
