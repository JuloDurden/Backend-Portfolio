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
  crossOriginResourcePolicy: { policy: "cross-origin" }, // 🔧 Pour les images
  contentSecurityPolicy: false // 🔧 Désactive CSP pour les uploads
}));

app.use(cors({
  origin: [
    'http://localhost:5173',  // npm run dev
    'http://localhost:4173',  // npm run preview  
    'https://portfolio-frontend-olive-seven.vercel.app', // 🔧 URL Vercel directe
    process.env.FRONTEND_VERCEL_URL,
    process.env.FRONTEND_URL  // production
  ].filter(Boolean), // Supprime les undefined
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 📊 Logging réduit pour éviter le spam
app.use(morgan('tiny')); // Plus simple que 'combined'

// 📦 Parsing du body (AVANT LES ROUTES!)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 🎯 ROUTE OPTIMISÉE POUR SERVIR LES FICHIERS - Railway Style
app.use('/uploads', express.static('/app/uploads', {
  maxAge: '7d', // Cache 7 jours (plus long)
  etag: true, // 🔧 Réactive etag pour le cache
  lastModified: true,
  dotfiles: 'deny',
  index: false,
  setHeaders: (res, filePath) => {
    // 🔧 Headers optimisés pour images
    if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
    
    // CORS pour toutes les images
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // 🚀 Cache optimisé
    res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 jours
  }
}));

// 🔍 Route d'info pour debug (temporaire)
app.get('/debug/uploads', (req, res) => {
  const skillsDir = '/app/uploads/skills';
  const projectsDir = '/app/uploads/projects';
  
  try {
    const skillsExists = fs.existsSync(skillsDir);
    const projectsExists = fs.existsSync(projectsDir);
    
    const skillFiles = skillsExists ? fs.readdirSync(skillsDir) : [];
    const projectFiles = projectsExists ? fs.readdirSync(projectsDir) : [];
    
    res.json({
      success: true,
      paths: {
        skills: {
          path: skillsDir,
          exists: skillsExists,
          files: skillFiles,
          count: skillFiles.length
        },
        projects: {
          path: projectsDir,
          exists: projectsExists,
          files: projectFiles,
          count: projectFiles.length
        }
      },
      NODE_ENV: process.env.NODE_ENV,
      // 🔧 URLs de test
      testUrls: skillFiles.slice(0, 2).map(file => ({
        file,
        url: `/uploads/skills/${file}`,
        fullUrl: `${req.protocol}://${req.get('host')}/uploads/skills/${file}`
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🏠 Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Portfolio API is running!',
    version: '2.0.0',
    documentation: '/api/docs',
    debug: '/debug/uploads'
  });
});

// 🔧 Test direct d'un fichier skill (ROUTE CORRIGÉE)
app.get('/test-skill-image', (req, res) => {
  const skillsDir = '/app/uploads/skills';
  try {
    if (fs.existsSync(skillsDir)) {
      const files = fs.readdirSync(skillsDir);
      if (files.length > 0) {
        const firstFile = files[0];
        const fullUrl = `${req.protocol}://${req.get('host')}/uploads/skills/${firstFile}`;
        
        return res.json({
          success: true,
          message: 'Fichier trouvé ✅',
          file: firstFile,
          relativeUrl: `/uploads/skills/${firstFile}`,
          fullUrl: fullUrl,
          totalFiles: files.length,
          allFiles: files.slice(0, 5) // 5 premiers fichiers
        });
      }
    }
    res.status(404).json({ 
      success: false, 
      message: 'Aucun fichier skill trouvé',
      directory: skillsDir,
      exists: fs.existsSync(skillsDir)
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      directory: skillsDir
    });
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

// ⚡ Configuration Multer OPTIMISÉE
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 10 // Max 10 fichiers simultanés
  },
  fileFilter: (req, file, cb) => {
    // 🔍 Log réduit (évite le spam)
    if (process.env.NODE_ENV === 'development') {
      console.log('📁 Upload:', file.originalname, file.mimetype);
    }
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

// 🔥 Middleware de gestion d'erreurs (AVANT la route 404)
app.use(errorHandler);

// 🚫 Route 404 POUR LES API SEULEMENT - DÉPLACÉE APRÈS errorHandler
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/api/skills',
      '/api/projects', 
      '/api/upload/skill-icon',
      '/debug/uploads',
      '/test-skill-image'
    ]
  });
});

// 🌐 Démarrage du serveur
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  // 🎯 INITIALISATION OPTIMISÉE DES DOSSIERS
  const mainUploadDir = '/app/uploads';
  const skillsUploadDir = '/app/uploads/skills';
  const projectsUploadDir = '/app/uploads/projects';
  
  console.log('🚀 Initialisation des dossiers uploads...');
  
  try {
    // Créer tous les dossiers
    [mainUploadDir, skillsUploadDir, projectsUploadDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Dossier créé: ${dir}`);
      }
    });
    
    // 🔧 COMPTAGE CORRIGÉ
    const skillFiles = fs.existsSync(skillsUploadDir) 
      ? fs.readdirSync(skillsUploadDir) 
      : [];
    
    const projectFiles = fs.existsSync(projectsUploadDir) 
      ? fs.readdirSync(projectsUploadDir) 
      : [];
    
    console.log(`📄 Skills: ${skillFiles.length} fichiers`);
    console.log(`📄 Projects: ${projectFiles.length} fichiers`);
    
    if (skillFiles.length > 0) {
      console.log(`📄 Premier skill: ${skillFiles[0]}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur initialisation uploads:', error);
  }

  console.log(`
🚀 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV}
📂 Upload path: ${mainUploadDir}
🔍 Debug: https://backend-portfolio-production-39a1.up.railway.app/debug/uploads
🎯 Test: https://backend-portfolio-production-39a1.up.railway.app/test-skill-image
📁 Files: https://backend-portfolio-production-39a1.up.railway.app/uploads/skills/

🎯 Frontend URLs autorisées:
   • http://localhost:5173 (dev)
   • https://portfolio-frontend-olive-seven.vercel.app (prod)
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
