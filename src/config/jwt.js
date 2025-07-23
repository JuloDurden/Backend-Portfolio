const jwt = require('jsonwebtoken');

const jwtConfig = {
  // Générer un token JWT
  generateToken: (payload, options = {}) => {
    const defaultOptions = {
      expiresIn: process.env.JWT_EXPIRE || '7d',
      issuer: process.env.JWT_ISSUER || 'portfolio-api',
      ...options
    };

    return jwt.sign(payload, process.env.JWT_SECRET, defaultOptions);
  },

  // Vérifier un token JWT
  verifyToken: (token) => {
    try {
      return {
        success: true,
        decoded: jwt.verify(token, process.env.JWT_SECRET),
        error: null
      };
    } catch (error) {
      return {
        success: false,
        decoded: null,
        error: error.message
      };
    }
  },

  // Décoder un token sans vérification (pour debug)
  decodeToken: (token) => {
    return jwt.decode(token, { complete: true });
  },

  // Générer un refresh token (plus long)
  generateRefreshToken: (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
    });
  },

  // Vérifier un refresh token
  verifyRefreshToken: (token) => {
    try {
      return {
        success: true,
        decoded: jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET),
        error: null
      };
    } catch (error) {
      return {
        success: false,
        decoded: null,
        error: error.message
      };
    }
  }
};

module.exports = jwtConfig;
