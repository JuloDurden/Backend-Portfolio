const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
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

// 📁 ROUTE DÉDIÉE POUR SERVIR LES FICHIERS UPLOADÉS
app.get('/uploads/*', (req, res) => {
  // ESSAYER PLUSIEURS CHEMINS POSSIBLES
  const possiblePaths = [
    path.join(__dirname, req.path),           // /app/src/uploads/...
    path.join(__dirname, '..', req.path),     // /app/uploads/...
    path.join(process.cwd(), req.path),       // /app/uploads/...
    path.join('/app', req.path)               // /app/uploads/...
  ];
  
  console.log('🔍 Chemins testés:', possiblePaths);
  
  // Fonction pour tester chaque chemin
  const tryNextPath = (index) => {
    if (index >= possiblePaths.length) {
      console.error('❌ AUCUN FICHIER TROUVÉ dans tous les chemins');
      return res.status(404).json({ 
        success: false, 
        message: 'Fichier non trouvé',
        path: req.path,
        tried: possiblePaths
      });
    }
    
    const currentPath = possiblePaths[index];
    console.log(`🧪 Test chemin ${index + 1}:`, currentPath);
    
    fs.access(currentPath, fs.constants.F_OK, (err) => {
      if (err) {
        console.log(`❌ Pas trouvé: ${currentPath}`);
        tryNextPath(index + 1); // Essayer le suivant
      } else {
        console.log(`✅ TROUVÉ: ${currentPath}`);
        res.sendFile(currentPath, (sendErr) => {
          if (sendErr) {
            console.error('❌ Erreur envoi fichier:', sendErr);
            res.status(500).json({ 
              success: false, 
              message: 'Erreur lors de l\'envoi du fichier' 
            });
          }
        });
      }
    });
  };
  
  tryNextPath(0); // Commencer par le premier chemin
});

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

// 🚫 Route 404 (GARDER EN DERNIER!)
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// 🔥 Middleware de gestion d'erreurs
app.use(errorHandler);

// 🌐 Démarrage du serveur
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  // ESSAYER DE CRÉER LE DOSSIER UPLOADS DANS TOUS LES ENDROITS POSSIBLES
  const possibleUploadsDirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, '..', 'uploads'),
    path.join(process.cwd(), 'uploads'),
    path.join('/app', 'uploads')
  ];
  
  console.log('🔍 Tentative création dossiers uploads dans:');
  possibleUploadsDirs.forEach((dir, index) => {
    console.log(`${index + 1}. ${dir}`);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Dossier créé: ${dir}`);
      } else {
        console.log(`📁 Dossier existe: ${dir}`);
      }
      
      const skillsDir = path.join(dir, 'skills');
      if (!fs.existsSync(skillsDir)) {
        fs.mkdirSync(skillsDir, { recursive: true });
        console.log(`✅ Dossier skills créé: ${skillsDir}`);
      } else {
        console.log(`📁 Dossier skills existe: ${skillsDir}`);
      }
    } catch (error) {
      console.log(`❌ Erreur création ${dir}:`, error.message);
    }
  });

  console.log(`
🚀 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV}
📱 API URL: http://localhost:${PORT}
🎯 Frontend: ${process.env.FRONTEND_URL}
📁 Uploads: http://localhost:${PORT}/uploads
📂 __dirname: ${__dirname}
📂 process.cwd(): ${process.cwd()}

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
