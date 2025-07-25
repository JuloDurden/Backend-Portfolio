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
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // 🔧 Pour les images
}));

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

// 📊 Logging (plus discret en production)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 📦 Parsing du body (AVANT LES ROUTES!)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 🎯 ROUTE CORRIGÉE POUR SERVIR LES FICHIERS - Railway Style
app.use('/uploads', express.static('/app/uploads', {
  maxAge: '1d', // Cache 1 jour
  etag: false,
  lastModified: false,
  dotfiles: 'deny',
  index: false, // Pas de listing des dossiers
  setHeaders: (res, path) => {
    // 🔧 Headers spécifiques pour les images
    if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// 🔍 Route d'info pour debug (temporaire)
app.get('/debug/uploads', (req, res) => {
  const uploadPaths = [
    '/app/uploads',
    '/app/src/uploads',
    path.join(__dirname, 'uploads'),
    path.join(__dirname, '..', 'uploads')
  ];
  
  const info = uploadPaths.map(p => {
    try {
      const exists = fs.existsSync(p);
      let files = [];
      if (exists && fs.existsSync(path.join(p, 'skills'))) {
        files = fs.readdirSync(path.join(p, 'skills'));
      }
      return { path: p, exists, skillsFiles: files };
    } catch (error) {
      return { path: p, exists: false, error: error.message };
    }
  });
  
  res.json({ uploadPaths: info, NODE_ENV: process.env.NODE_ENV });
});

// 🏠 Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Portfolio API is running!',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// 🔧 Test direct d'un fichier skill (pour debug)
app.get('/test-skill-image', (req, res) => {
  const skillsDir = '/app/uploads/skills';
  try {
    if (fs.existsSync(skillsDir)) {
      const files = fs.readdirSync(skillsDir);
      if (files.length > 0) {
        const firstFile = files[0];
        return res.json({
          success: true,
          message: 'Fichier trouvé',
          file: firstFile,
          url: `/uploads/skills/${firstFile}`,
          fullUrl: `${req.protocol}://${req.get('host')}/uploads/skills/${firstFile}`
        });
      }
    }
    res.json({ success: false, message: 'Aucun fichier skill trouvé' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
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
  },
  fileFilter: (req, file, cb) => {
    // 🔍 Log du fichier reçu
    console.log('🔍 Fichier reçu:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    cb(null, true);
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

// 🚫 Route 404 POUR LES API SEULEMENT (laisse /uploads tranquille)
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`
  });
});

// 🔥 Middleware de gestion d'erreurs
app.use(errorHandler);

// 🌐 Démarrage du serveur
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  // 🎯 CRÉATION FORCÉE DU DOSSIER PRINCIPAL SUR RAILWAY
  const mainUploadDir = '/app/uploads';
  const skillsUploadDir = '/app/uploads/skills';
  const projectsUploadDir = '/app/uploads/projects';
  
  console.log('🚀 Initialisation des dossiers uploads sur Railway...');
  
  try {
    // Créer le dossier principal
    if (!fs.existsSync(mainUploadDir)) {
      fs.mkdirSync(mainUploadDir, { recursive: true });
      console.log(`✅ Dossier principal créé: ${mainUploadDir}`);
    } else {
      console.log(`📁 Dossier principal existe: ${mainUploadDir}`);
    }
    
    // Créer le sous-dossier skills
    if (!fs.existsSync(skillsUploadDir)) {
      fs.mkdirSync(skillsUploadDir, { recursive: true });
      console.log(`✅ Dossier skills créé: ${skillsUploadDir}`);
    } else {
      console.log(`📁 Dossier skills existe: ${skillsUploadDir}`);
    }
    
    // Créer le sous-dossier projects
    if (!fs.existsSync(projectsUploadDir)) {
      fs.mkdirSync(projectsUploadDir, { recursive: true });
      console.log(`✅ Dossier projects créé: ${projectsUploadDir}`);
    } else {
      console.log(`📁 Dossier projects existe: ${projectsUploadDir}`);
    }
    
    // Vérifier les fichiers existants
    if (fs.existsSync(skillsUploadDir)) {
      const skillFiles = fs.readdirSync(skillsUploadDir);
      console.log(`📄 Fichiers skills trouvés: ${skillFiles.length}`);
      if (skillFiles.length > 0) {
        console.log(`📄 Premier fichier: ${skillFiles[0]}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur initialisation uploads:', error);
  }

  console.log(`
🚀 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV}
📱 API URL: http://localhost:${PORT}
🎯 Frontend: ${process.env.FRONTEND_URL}
📁 Uploads: http://localhost:${PORT}/uploads
📂 Upload path: ${mainUploadDir}
🔍 Debug info: http://localhost:${PORT}/debug/uploads
🎯 Test image: http://localhost:${PORT}/test-skill-image

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
