const Experience = require('../models/Experience');
const fs = require('fs');
const path = require('path');

// Fonction locale pour supprimer une image
const deleteImage = (imagePath) => {
  try {
    if (!imagePath) return;
    const fullPath = path.join(__dirname, '../../uploads', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`✅ Image supprimée: ${imagePath}`);
    }
  } catch (error) {
    console.error(`❌ Erreur suppression image:`, error);
  }
};

const experienceController = {
  // GET /api/experiences - Récupérer toutes les expériences (PUBLIC)
  getAllExperiences: async (req, res) => {
    try {
      const { type, sort = 'newest' } = req.query;
      
      let query = {};
      if (type && type !== 'all') {
        query.type = type; // 'work' ou 'education'
      }

      let sortCriteria = {};
      switch (sort) {
        case 'oldest':
          sortCriteria = { startDate: 1 };
          break;
        case 'position':
          sortCriteria = { position: 1 };
          break;
        case 'company':
          sortCriteria = { company: 1 };
          break;
        default: // newest
          sortCriteria = { startDate: -1 };
      }

      const experiences = await Experience.find(query).sort(sortCriteria);

      // Calculer les stats
      const stats = {
        totalWork: await Experience.countDocuments({ type: 'work' }),
        totalEducation: await Experience.countDocuments({ type: 'education' }),
        totalCount: experiences.length,
        currentJobs: await Experience.countDocuments({ 
          type: 'work', 
          endDate: null // En cours
        })
      };

      res.json({
        success: true,
        data: experiences,
        stats
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des expériences:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },

  // GET /api/experiences/:id - Récupérer une expérience (PUBLIC)
  getExperienceById: async (req, res) => {
    try {
      const experience = await Experience.findById(req.params.id);
      
      if (!experience) {
        return res.status(404).json({
          success: false,
          message: 'Expérience non trouvée'
        });
      }

      res.json({
        success: true,
        data: experience
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'expérience:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },

  // POST /api/experiences - Créer une expérience (PROTÉGÉ)
  createExperience: async (req, res) => {
    try {
      const {
        type, position, company, location, startDate, endDate,
        description, technologies
      } = req.body;

      // VÉRIFICATION IMAGE OBLIGATOIRE
      const image = req.uploadedFiles?.image;
      if (!image) {
        return res.status(400).json({
          success: false,
          message: 'Image obligatoire pour créer une expérience'
        });
      }

      const experience = new Experience({
        type,
        position,
        company,
        location,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        description: Array.isArray(description) ? description : [description],
        technologies: Array.isArray(technologies) ? technologies : (technologies ? [technologies] : []),
        image
      });

      await experience.save();

      res.status(201).json({
        success: true,
        data: experience,
        message: 'Expérience créée avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'expérience:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },

  // PUT /api/experiences/:id - Modifier une expérience (PROTÉGÉ)
  updateExperience: async (req, res) => {
    try {
      const {
        type, position, company, location, startDate, endDate,
        description, technologies
      } = req.body;

      const experience = await Experience.findById(req.params.id);
      
      if (!experience) {
        return res.status(404).json({
          success: false,
          message: 'Expérience non trouvée'
        });
      }

      // Gestion de l'image
      if (req.uploadedFiles?.image) {
        if (experience.image) {
          deleteImage(experience.image);
        }
        experience.image = req.uploadedFiles.image;
      }

      // ✅ MISE À JOUR SÉLECTIVE (seulement les champs fournis)
      const updateFields = {};

      if (type) updateFields.type = type;
      if (position) updateFields.position = position;
      if (company !== undefined) updateFields.company = company; // Peut être vide
      if (location) updateFields.location = location;
      
      // ✅ VALIDATION DES DATES
      if (startDate) {
        const parsedStartDate = new Date(startDate);
        if (!isNaN(parsedStartDate.getTime())) {
          updateFields.startDate = parsedStartDate;
        }
      }
      
      if (endDate !== undefined) {
        if (endDate) {
          const parsedEndDate = new Date(endDate);
          if (!isNaN(parsedEndDate.getTime())) {
            updateFields.endDate = parsedEndDate;
          }
        } else {
          updateFields.endDate = null; // Job actuel
        }
      }

      // ✅ GESTION DESCRIPTION
      if (description) {
        updateFields.description = Array.isArray(description) 
          ? description.filter(d => d && d.trim()) // Supprime les vides
          : [description].filter(d => d && d.trim());
      }

      // ✅ GESTION TECHNOLOGIES  
      if (technologies) {
        updateFields.technologies = Array.isArray(technologies)
          ? technologies.filter(t => t && t.trim()) // Supprime les vides
          : [technologies].filter(t => t && t.trim());
      }

      // ✅ APPLICATION DES MISES À JOUR
      Object.assign(experience, updateFields);

      await experience.save();

      res.json({
        success: true,
        data: experience,
        message: 'Expérience mise à jour avec succès'
      });
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'expérience:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },

  // DELETE /api/experiences/:id - Supprimer une expérience (PROTÉGÉ)
  deleteExperience: async (req, res) => {
    try {
      const experience = await Experience.findById(req.params.id);
      
      if (!experience) {
        return res.status(404).json({
          success: false,
          message: 'Expérience non trouvée'
        });
      }

      // Supprimer l'image avant de supprimer l'expérience
      if (experience.image) {
        deleteImage(experience.image);
      }

      await Experience.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: 'Expérience supprimée avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'expérience:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
};

module.exports = experienceController;
