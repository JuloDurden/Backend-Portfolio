const Experience = require('../models/Experience');
const { deleteExperienceImage } = require('../middleware/uploadExperience');

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
      console.log('📝 Données reçues:', req.body);
      console.log('📁 Fichier uploadé:', req.uploadedFiles);

      // ✅ VALIDATION DE L'IMAGE
      const image = req.uploadedFiles?.image;
      if (!image) {
        return res.status(400).json({
          success: false,
          message: 'Image obligatoire pour créer une expérience'
        });
      }

      // ✅ VALIDATION ET CONVERSION DES DATES
      let startDate = null;
      let endDate = null;

      if (req.body.startDate) {
        startDate = new Date(req.body.startDate);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Format de startDate invalide (utilisez YYYY-MM-DD)'
          });
        }
      }

      if (req.body.endDate) {
        endDate = new Date(req.body.endDate);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Format de endDate invalide (utilisez YYYY-MM-DD)'
          });
        }
      }

      // ✅ CONSTRUCTION TABLEAU DESCRIPTION (REGEX CORRIGÉE)
      let description = [];
      
      // 1. Récupérer depuis description[0], description[1], etc.
      Object.keys(req.body).forEach(key => {
        const match = key.match(/^description

$$
(\d+)
$$

$/);
        if (match) {
          const index = parseInt(match[1]);
          if (req.body[key] && req.body[key].trim()) {
            description[index] = req.body[key].trim();
          }
        }
      });
      
      // 2. Si pas de description[x], essayer le champ direct
      if (description.length === 0 && req.body.description) {
        if (Array.isArray(req.body.description)) {
          description = req.body.description.filter(d => d && d.trim());
        } else if (typeof req.body.description === 'string') {
          description = [req.body.description.trim()];
        }
      }

      // 3. S'assurer d'avoir au moins 3 éléments non vides
      while (description.length < 3) {
        description.push('Description à compléter');
      }

      console.log('📋 Description construite:', description);

      // ✅ CONSTRUCTION TABLEAU TECHNOLOGIES (REGEX CORRIGÉE)
      let technologies = [];
      
      Object.keys(req.body).forEach(key => {
        const match = key.match(/^technologies

$$
(\d+)
$$

$/);
        if (match) {
          const index = parseInt(match[1]);
          if (req.body[key] && req.body[key].trim()) {
            technologies[index] = req.body[key].trim();
          }
        }
      });

      // Si pas de technologies[x], essayer le champ direct
      if (technologies.length === 0 && req.body.technologies) {
        if (Array.isArray(req.body.technologies)) {
          technologies = req.body.technologies.filter(t => t && t.trim());
        } else if (typeof req.body.technologies === 'string') {
          technologies = [req.body.technologies.trim()];
        }
      }

      console.log('🔧 Technologies construites:', technologies);

      // ✅ VALIDATION CHAMPS OBLIGATOIRES
      if (!req.body.type || !['work', 'education'].includes(req.body.type)) {
        return res.status(400).json({
          success: false,
          message: 'Type requis (work ou education)'
        });
      }

      if (!req.body.position || !req.body.position.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Position est requise'
        });
      }

      if (!startDate) {
        return res.status(400).json({
          success: false,
          message: 'Date de début est requise'
        });
      }

      // ✅ CRÉATION DE L'EXPÉRIENCE
      const experience = new Experience({
        type: req.body.type.trim(),
        position: req.body.position.trim(),
        company: req.body.company ? req.body.company.trim() : '',
        location: req.body.location ? req.body.location.trim() : '',
        startDate: startDate,
        endDate: endDate,
        description: description,
        technologies: technologies,
        image: image // URL Cloudinary complète
      });

      console.log('💾 Tentative de sauvegarde:', {
        type: experience.type,
        position: experience.position,
        startDate: experience.startDate,
        descriptionLength: experience.description.length,
        hasImage: !!experience.image
      });

      const savedExperience = await experience.save();

      console.log('✅ Expérience sauvegardée avec ID:', savedExperience._id);

      res.status(201).json({
        success: true,
        data: savedExperience,
        message: 'Expérience créée avec succès'
      });

    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'expérience:', error);
      
      // Si erreur, supprimer l'image uploadée sur Cloudinary
      if (req.uploadedFiles?.image) {
        try {
          await deleteExperienceImage(req.uploadedFiles.image);
          console.log('🗑️ Image supprimée après échec création');
        } catch (cleanupError) {
          console.error('❌ Erreur suppression image cleanup:', cleanupError);
        }
      }

      // Gestion erreurs spécifiques
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }));

        console.error('📋 Erreurs de validation:', validationErrors);

        return res.status(400).json({
          success: false,
          message: 'Erreur de validation',
          errors: validationErrors
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la création',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // PUT /api/experiences/:id - Modifier une expérience (PROTÉGÉ)
  updateExperience: async (req, res) => {
    try {
      console.log('🔄 Mise à jour expérience:', req.params.id);
      console.log('📝 Données reçues:', req.body);

      const experience = await Experience.findById(req.params.id);
      
      if (!experience) {
        return res.status(404).json({
          success: false,
          message: 'Expérience non trouvée'
        });
      }

      // Sauvegarder l'ancienne image pour suppression si remplacement
      const oldImage = experience.image;

      // ✅ MISE À JOUR SÉLECTIVE (seulement les champs fournis)
      const updateFields = {};

      if (req.body.type) updateFields.type = req.body.type.trim();
      if (req.body.position) updateFields.position = req.body.position.trim();
      if (req.body.company !== undefined) updateFields.company = req.body.company ? req.body.company.trim() : '';
      if (req.body.location !== undefined) updateFields.location = req.body.location ? req.body.location.trim() : '';
      
      // ✅ VALIDATION DES DATES
      if (req.body.startDate) {
        const parsedStartDate = new Date(req.body.startDate);
        if (!isNaN(parsedStartDate.getTime())) {
          updateFields.startDate = parsedStartDate;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Format de startDate invalide'
          });
        }
      }
      
      if (req.body.endDate !== undefined) {
        if (req.body.endDate) {
          const parsedEndDate = new Date(req.body.endDate);
          if (!isNaN(parsedEndDate.getTime())) {
            updateFields.endDate = parsedEndDate;
          } else {
            return res.status(400).json({
              success: false,
              message: 'Format de endDate invalide'
            });
          }
        } else {
          updateFields.endDate = null; // Job actuel
        }
      }

      // ✅ GESTION DESCRIPTION (REGEX CORRIGÉE)
      if (req.body.description) {
        let description = [];
        
        // Récupérer depuis description[0], description[1], etc.
        Object.keys(req.body).forEach(key => {
          const match = key.match(/^description

$$
(\d+)
$$

$/);
          if (match) {
            const index = parseInt(match[1]);
            if (req.body[key] && req.body[key].trim()) {
              description[index] = req.body[key].trim();
            }
          }
        });
        
        // Si pas de description[x], utiliser le champ direct
        if (description.length === 0) {
          updateFields.description = Array.isArray(req.body.description) 
            ? req.body.description.filter(d => d && d.trim())
            : [req.body.description].filter(d => d && d.trim());
        } else {
          updateFields.description = description.filter(d => d);
        }
      }

      // ✅ GESTION TECHNOLOGIES (REGEX CORRIGÉE)
      if (req.body.technologies) {
        let technologies = [];
        
        Object.keys(req.body).forEach(key => {
          const match = key.match(/^technologies

$$
(\d+)
$$

$/);
          if (match) {
            const index = parseInt(match[1]);
            if (req.body[key] && req.body[key].trim()) {
              technologies[index] = req.body[key].trim();
            }
          }
        });
        
        if (technologies.length === 0) {
          updateFields.technologies = Array.isArray(req.body.technologies)
            ? req.body.technologies.filter(t => t && t.trim())
            : [req.body.technologies].filter(t => t && t.trim());
        } else {
          updateFields.technologies = technologies.filter(t => t);
        }
      }

      // ✅ GESTION DE L'IMAGE
      if (req.uploadedFiles?.image) {
        updateFields.image = req.uploadedFiles.image; // Nouvelle URL Cloudinary
      }

      console.log('🔄 Champs à mettre à jour:', updateFields);

      // ✅ APPLICATION DES MISES À JOUR
      Object.assign(experience, updateFields);

      const savedExperience = await experience.save();

      // Supprimer l'ancienne image après succès de la sauvegarde
      if (req.uploadedFiles?.image && oldImage && oldImage !== experience.image) {
        try {
          await deleteExperienceImage(oldImage);
          console.log('🗑️ Ancienne image supprimée');
        } catch (cleanupError) {
          console.error('❌ Erreur suppression ancienne image:', cleanupError);
        }
      }

      res.json({
        success: true,
        data: savedExperience,
        message: 'Expérience mise à jour avec succès'
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'expérience:', error);
      
      // Si erreur et nouvelle image uploadée, la supprimer
      if (req.uploadedFiles?.image) {
        try {
          await deleteExperienceImage(req.uploadedFiles.image);
        } catch (cleanupError) {
          console.error('❌ Erreur suppression nouvelle image:', cleanupError);
        }
      }

      // Gestion erreurs spécifiques
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Erreur de validation',
          errors: validationErrors
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la mise à jour'
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

      // Supprimer l'image de Cloudinary avant de supprimer l'expérience
      if (experience.image) {
        try {
          await deleteExperienceImage(experience.image);
          console.log('🗑️ Image supprimée avant suppression expérience');
        } catch (imageError) {
          console.error('❌ Erreur suppression image:', imageError);
          // Continuer même si suppression image échoue
        }
      }

      await Experience.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: 'Expérience supprimée avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'expérience:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la suppression'
      });
    }
  }
};

module.exports = experienceController;
