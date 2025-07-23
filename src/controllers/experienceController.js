const Experience = require('../models/Experience');

const experienceController = {
  // GET /api/experiences - Récupérer toutes les expériences (PUBLIC)
  getAllExperiences: async (req, res) => {
    try {
      const { type, sort = 'newest' } = req.query;
      
      let query = {};
      if (type && type !== 'all') {
        if (type === 'active') {
          query.isCurrentlyActive = true;
        } else {
          query.type = type;
        }
      }

      let sortCriteria = {};
      switch (sort) {
        case 'oldest':
          sortCriteria = { startDate: 1 };
          break;
        case 'title':
          sortCriteria = { title: 1 };
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
        totalExperiences: await Experience.countDocuments({ type: 'experience' }),
        totalFormations: await Experience.countDocuments({ type: 'formation' }),
        totalCount: experiences.length,
        activeExperiences: await Experience.countDocuments({ isCurrentlyActive: true })
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
        type, title, company, location, startDate, endDate,
        isCurrentlyActive, description, technologies, photo
      } = req.body;

      const experience = new Experience({
        type, title, company, location, startDate, endDate,
        isCurrentlyActive, description, technologies, photo
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
        type, title, company, location, startDate, endDate,
        isCurrentlyActive, description, technologies, photo
      } = req.body;

      const experience = await Experience.findById(req.params.id);
      
      if (!experience) {
        return res.status(404).json({
          success: false,
          message: 'Expérience non trouvée'
        });
      }

      Object.assign(experience, {
        type, title, company, location, startDate, endDate,
        isCurrentlyActive, description, technologies, photo
      });

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