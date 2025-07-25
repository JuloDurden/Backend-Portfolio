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

// 🧪 Test des modèles (temporaire)
const Project = require('./models/Project');
const Skill = require('./models/Skill');

// 🛡️ Middlewares de sécurité (AVANT LES ROUTES!)
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',  // npm run dev
    'http://localhost:4173',  // npm run preview  
    process.env.FRONTEND_VERCEL_URL,
    process.env.FRONTEND_URL  // production
  ].filter(Boolean), // Supprime les undefined
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 📊 Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 📦 Parsing du body (AVANT LES ROUTES!)
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

// ======= IMPORT DES ROUTES =======
const skillRoutes = require('./routes/skillRoutes');
const projectRoutes = require('./routes/projectRoutes');
const userRoutes = require('./routes/userRoutes');
const experienceRoutes = require('./routes/experienceRoutes');
const authRoutes = require('./routes/authRoutes');

// 🔥 Import pour Upload Controller
const multer = require('multer');
const UploadController = require('./controllers/uploadController');

// ⚡ Configuration Multer pour uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 10 // Max 10 fichiers simultanés
  }
});

// ======= UTILISATION DES ROUTES =======
// Routes publiques
app.use('/api/skills', skillRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/user', userRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/auth', authRoutes);

// 📸 ROUTES UPLOAD DIRECTES - TOUTES LES VARIANTES
// Pour projets
app.post('/api/upload/cover', upload.single('cover'), UploadController.uploadCover);
app.post('/api/upload/pictures', upload.array('pictures', 10), UploadController.uploadPictures);

// Pour skills - TOUTES LES VARIANTES POSSIBLES
app.post('/api/upload/skill-icon', upload.single('icon'), UploadController.uploadSkillIcon);
app.post('/api/upload/skills', upload.single('icon'), UploadController.uploadSkillIcon);
app.post('/api/upload/skill-icons', upload.single('icon'), UploadController.uploadSkillIcon);

// Nettoyage
app.post('/api/upload/cleanup', UploadController.cleanup);

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
const PORT = process.env.PORT || 5000; // 🔄 CHANGÉ POUR TON PORT

const server = app.listen(PORT, () => {
  console.log(`
🚀 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV}
📱 API URL: http://localhost:${PORT}
🎯 Frontend: ${process.env.FRONTEND_URL}
📁 Uploads: http://localhost:${PORT}/uploads

📸 Upload routes available:
   • POST /api/upload/cover
   • POST /api/upload/pictures  
   • POST /api/upload/skill-icon
   • POST /api/upload/skills
   • POST /api/upload/skill-icons
   • POST /api/upload/cleanup
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
