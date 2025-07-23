// src/controllers/authController.js
const User = require('../models/User');
const jwtConfig = require('../config/jwt');

// Générer un token JWT
const generateToken = (id) => {
  return jwtConfig.generateToken({ id });
};

const authController = {
  // POST /api/auth/login - Connexion
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email et mot de passe requis'
        });
      }

      const user = await User.findOne({ email }).select('+password');

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      const token = generateToken(user._id);

      res.json({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          },
          token
        }
      });

    } catch (error) {
      console.error('Erreur login:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },

  // GET /api/auth/me - Vérifier le token
  getMe: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },

  // POST /api/auth/logout - Déconnexion
  logout: (req, res) => {
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
    // Le token sera supprimé côté frontend
  }
};

module.exports = authController;
