const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import des middlewares
const errorHandler = require('./middleware/errorHandler');

// Import de la config DB
const connectDB = require('./config/database');

const app = express();

// 🔗 Connexion à la base de données
connectDB();

// 🛡️ Middlewares de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// 📊 Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 📦 Parsing du body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 📁 Static files (uploads)
app.use('/uploads', express.static('uploads'));

// 🏠 Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Portfolio API is running!',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// 🚫 Route 404
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// 🔥 Middleware de gestion d'erreurs
app.use(errorHandler);

// 🌐 Démarrage du serveur
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`
🚀 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV}
📱 API URL: http://localhost:${PORT}
🎯 Frontend: ${process.env.FRONTEND_URL}
  `);
});

// Gestion propre de l'arrêt
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
