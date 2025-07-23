// src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const authController = {
  // POST /api/auth/login - Connexion
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Vérifier si email et password sont fournis
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email et mot de passe requis'
        });
      }

      // Récupérer l'utilisateur avec le password
      const user = await User.findOne({ email }).select('+password');

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Générer le token
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
  }
};

module.exports = authController;
