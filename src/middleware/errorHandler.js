const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log l'erreur
  console.error('🔴 Error:', err);

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = {
      message: message.join(', '),
      statusCode: 400
    };
  }

  // Erreur de cast Mongoose (mauvais ObjectId)
  if (err.name === 'CastError') {
    const message = 'Ressource non trouvée';
    error = {
      message,
      statusCode: 404
    };
  }

  // Erreur de duplication MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} existe déjà`;
    error = {
      message,
      statusCode: 400
    };
  }

  // JWT Erreur
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token invalide';
    error = {
      message,
      statusCode: 401
    };
  }

  // JWT Expiré
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expiré';
    error = {
      message,
      statusCode: 401
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
