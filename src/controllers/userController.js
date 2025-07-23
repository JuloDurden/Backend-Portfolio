const User = require('../models/User');

const userController = {
  // GET /api/user - Récupérer les infos user (PUBLIC)
  getUser: async (req, res) => {
    try {
      const user = await User.findOne(); // Un seul utilisateur
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },

  // POST /api/user - Créer utilisateur (PROTÉGÉ)
  createUser: async (req, res) => {
    try {
      const {
        firstName, lastName, email, password, dateOfBirth, githubUrl, profilePicture,
        currentJob, introductionParagraph, journeyParagraph, goalsParagraph, hobbies
      } = req.body;

      // ✅ VÉRIFICATION DES CHAMPS REQUIS (avec password)
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nom, prénom, email et mot de passe sont requis'
        });
      }

      // Vérifier qu'il n'y a pas déjà un utilisateur
      const existingUser = await User.findOne();
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Un utilisateur existe déjà'
        });
      }

      // ✅ INCLURE LE PASSWORD
      const user = new User({
        firstName, lastName, email, password, dateOfBirth, githubUrl, profilePicture,
        currentJob, introductionParagraph, journeyParagraph, goalsParagraph, hobbies
      });

      await user.save();

      // ✅ SUPPRIMER LE PASSWORD DE LA RÉPONSE
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(201).json({
        success: true,
        data: userResponse,
        message: 'Utilisateur créé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },

  // PUT /api/user - Modifier utilisateur (PROTÉGÉ)
  updateUser: async (req, res) => {
    try {
      const {
        firstName, lastName, email, password, dateOfBirth, githubUrl, profilePicture,
        currentJob, introductionParagraph, journeyParagraph, goalsParagraph, hobbies
      } = req.body;

      const user = await User.findOne();
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // ✅ MISE À JOUR AVEC PASSWORD (optionnel en modification)
      const updateData = {
        firstName, lastName, email, dateOfBirth, githubUrl, profilePicture,
        currentJob, introductionParagraph, journeyParagraph, goalsParagraph, hobbies
      };

      // Si un nouveau password est fourni, l'inclure
      if (password) {
        updateData.password = password;
      }

      Object.assign(user, updateData);
      await user.save();

      // ✅ SUPPRIMER LE PASSWORD DE LA RÉPONSE
      const userResponse = user.toObject();
      delete userResponse.password;

      res.json({
        success: true,
        data: userResponse,
        message: 'Utilisateur mis à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
};

module.exports = userController;
