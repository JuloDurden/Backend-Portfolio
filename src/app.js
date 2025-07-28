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
    'https://portfolio-mu-liart-34.vercel.app', // 🔧 URL Vercel directe
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

// 🔥 CORRECTION FINALE : SERVIR DEPUIS LE BON PATH + FALLBACK
const uploadsPath = process.env.NODE_ENV === 'production' 
  ? '/app/public/uploads'  // Railway
  : path.join(process.cwd(), 'public/uploads'); // Local

app.use('/uploads', express.static(uploadsPath, {
  maxAge: '7d',
  etag: true,
  lastModified: true,
  dotfiles: 'deny',
  index: false,
  setHeaders: (res, filePath) => {
    // Headers optimisés pour tous types d'images
    if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
    
    // CORS pour toutes les images
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=604800');
  }
}));

// 🔍 DEBUG COMPLET AVEC DIAGNOSTIC SYSTÈME
app.get('/debug/uploads', (req, res) => {
  const skillsDir = path.join(uploadsPath, 'skills');
  const coversSmallDir = path.join(uploadsPath, 'projects/covers/400x400');
  const coversLargeDir = path.join(uploadsPath, 'projects/covers/1000x1000');
  const picturesDir = path.join(uploadsPath, 'projects/pictures');
  
  try {
    const result = {
      success: true,
      system: {
        cwd: process.cwd(),
        nodeEnv: process.env.NODE_ENV,
        uploadsPath: uploadsPath,
        platform: process.platform
      },
      paths: {},
      testUrls: []
    };
    
    // Check chaque dossier avec diagnostic
    const dirs = [
      { name: 'skills', path: skillsDir },
      { name: 'covers_small', path: coversSmallDir },
      { name: 'covers_large', path: coversLargeDir },
      { name: 'pictures', path: picturesDir }
    ];
    
    dirs.forEach(({ name, path: dirPath }) => {
      const exists = fs.existsSync(dirPath);
      let files = [];
      let permissions = null;
      
      if (exists) {
        try {
          files = fs.readdirSync(dirPath);
          const stats = fs.statSync(dirPath);
          permissions = {
            mode: stats.mode.toString(8),
            isWritable: (stats.mode & parseInt('200', 8)) !== 0
          };
        } catch (e) {
          permissions = { error: e.message };
        }
      }
      
      result.paths[name] = {
        path: dirPath,
        exists,
        files: files.slice(0, 5),
        count: files.length,
        permissions
      };
      
      // URL de test pour le premier fichier
      if (files.length > 0) {
        const urlPath = dirPath.replace(uploadsPath, '');
        result.testUrls.push({
          type: name,
          file: files[0],
          url: `/uploads${urlPath}/${files[0]}`,
          fullUrl: `${req.protocol}://${req.get('host')}/uploads${urlPath}/${files[0]}`
        });
      }
    });
    
    res.json(result);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 🧪 TEST UPLOAD IMMÉDIAT POUR DIAGNOSTIC
app.post('/debug/test-upload', (req, res) => {
  try {
    const testContent = `Test upload ${Date.now()}`;
    const testPath = path.join(uploadsPath, `test-${Date.now()}.txt`);
    
    fs.writeFileSync(testPath, testContent);
    
    // Vérifie immédiatement
    const exists = fs.existsSync(testPath);
    const canRead = exists ? fs.readFileSync(testPath, 'utf8') : null;
    
    // Nettoie
    if (exists) {
      try { fs.unlinkSync(testPath); } catch(e) {}
    }
    
    res.json({
      success: true,
      message: 'Test d\'écriture réussi',
      testPath,
      exists,
      contentMatch: canRead === testContent,
      uploadsPath
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      uploadsPath
    });
  }
});

// 🏠 Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Portfolio API is running!',
    version: '2.1.0',
    documentation: '/api/docs',
    debug: '/debug/uploads',
    testUpload: '/debug/test-upload'
  });
});

// 🔧 TEST COVERS AMÉLIORÉ
app.get('/test-cover-image', (req, res) => {
  const coversDir = path.join(uploadsPath, 'projects/covers/400x400');
  try {
    if (fs.existsSync(coversDir)) {
      const files = fs.readdirSync(coversDir).filter(f => f.endsWith('.webp'));
      if (files.length > 0) {
        const firstFile = files[0];
        const fullUrl = `${req.protocol}://${req.get('host')}/uploads/projects/covers/400x400/${firstFile}`;
        
        return res.json({
          success: true,
          message: 'Cover trouvée ✅',
          file: firstFile,
          relativeUrl: `/uploads/projects/covers/400x400/${firstFile}`,
          fullUrl: fullUrl,
          totalFiles: files.length,
          allFiles: files.slice(0, 5)
        });
      }
    }
    res.status(404).json({ 
      success: false, 
      message: 'Aucune cover trouvée',
      directory: coversDir,
      exists: fs.existsSync(coversDir)
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      directory: coversDir
    });
  }
});

// 🔧 Test skill amélioré
app.get('/test-skill-image', (req, res) => {
  const skillsDir = path.join(uploadsPath, 'skills');
  try {
    if (fs.existsSync(skillsDir)) {
      const files = fs.readdirSync(skillsDir).filter(f => f.endsWith('.png') || f.endsWith('.svg'));
      if (files.length > 0) {
        const firstFile = files[0];
        const fullUrl = `${req.protocol}://${req.get('host')}/uploads/skills/${firstFile}`;
        
        return res.json({
          success: true,
          message: 'Fichier skill trouvé ✅',
          file: firstFile,
          relativeUrl: `/uploads/skills/${firstFile}`,
          fullUrl: fullUrl,
          totalFiles: files.length,
          allFiles: files.slice(0, 5)
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

// ⚡ Configuration Multer ROBUSTE
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 10 // Max 10 fichiers simultanés
  },
  fileFilter: (req, file, cb) => {
    // Validation renforcée
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      console.log(`📁 Upload accepté: ${file.originalname} (${file.mimetype})`);
      return cb(null, true);
    } else {
      console.log(`❌ Upload rejeté: ${file.originalname} (${file.mimetype})`);
      return cb(new Error('Type de fichier non autorisé'));
    }
  }
});

// ======= UTILISATION DES ROUTES =======
// Routes publiques
app.use('/api/skills', skillRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/user', userRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/auth', authRoutes);

// 📸 ROUTES UPLOAD AVEC LOGGING RENFORCÉ
app.post('/api/upload/cover', (req, res, next) => {
  console.log('🎯 Tentative upload cover...');
  next();
}, upload.single('cover'), UploadController.uploadCover);

app.post('/api/upload/pictures', (req, res, next) => {
  console.log('🎯 Tentative upload pictures...');
  next();
}, upload.array('pictures', 10), UploadController.uploadPictures);

app.post('/api/upload/skill-icon', (req, res, next) => {
  console.log('🎯 Tentative upload skill-icon...');
  next();
}, upload.single('icon'), UploadController.uploadSkillIcon);

app.post('/api/upload/skills', upload.single('icon'), UploadController.uploadSkillIcon);
app.post('/api/upload/skill-icons', upload.single('icon'), UploadController.uploadSkillIcon);

// Nettoyage
app.post('/api/upload/cleanup', UploadController.cleanup);

// 🔥 Middleware de gestion d'erreurs (AVANT la route 404)
app.use(errorHandler);

// 🚫 Route 404 POUR LES API SEULEMENT
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/api/skills',
      '/api/projects', 
      '/api/upload/skill-icon',
      '/debug/uploads',
      '/debug/test-upload',
      '/test-skill-image',
      '/test-cover-image'
    ]
  });
});

// 🌐 Démarrage du serveur
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  // 🎯 INITIALISATION AVEC PATH DYNAMIC
  const skillsUploadDir = path.join(uploadsPath, 'skills');
  const projectsUploadDirs = [
    path.join(uploadsPath, 'projects'),
    path.join(uploadsPath, 'projects/covers'),
    path.join(uploadsPath, 'projects/covers/400x400'),
    path.join(uploadsPath, 'projects/covers/1000x1000'),
    path.join(uploadsPath, 'projects/pictures')
  ];
  
  console.log('🚀 Initialisation des dossiers uploads...');
  console.log(`📂 Base upload path: ${uploadsPath}`);
  
  try {
    // Créer tous les dossiers
    const allDirs = [uploadsPath, skillsUploadDir, ...projectsUploadDirs];
    allDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
        console.log(`✅ Dossier créé: ${dir}`);
      }
    });
    
    // Test d'écriture immédiat
    const testFile = path.join(uploadsPath, 'test-write.txt');
    try {
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('✅ Écriture possible dans', uploadsPath);
    } catch (e) {
      console.error('❌ Impossible d\'écrire dans', uploadsPath, e.message);
    }
    
    // Comptage des fichiers
    const skillFiles = fs.existsSync(skillsUploadDir) ? fs.readdirSync(skillsUploadDir) : [];
    const coverFiles = fs.existsSync(path.join(uploadsPath, 'projects/covers/400x400')) 
      ? fs.readdirSync(path.join(uploadsPath, 'projects/covers/400x400')) : [];
    
    console.log(`📄 Skills: ${skillFiles.length} fichiers`);
    console.log(`📄 Covers: ${coverFiles.length} fichiers`);
    
    if (skillFiles.length > 0) console.log(`📄 Premier skill: ${skillFiles[0]}`);
    if (coverFiles.length > 0) console.log(`📄 Première cover: ${coverFiles[0]}`);
    
  } catch (error) {
    console.error('❌ Erreur initialisation uploads:', error);
  }

  console.log(`
🚀 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV}
📂 Upload path: ${uploadsPath}
🔍 Debug: https://backend-portfolio-production-39a1.up.railway.app/debug/uploads
🧪 Test Upload: https://backend-portfolio-production-39a1.up.railway.app/debug/test-upload
🎯 Test Skills: https://backend-portfolio-production-39a1.up.railway.app/test-skill-image
🎯 Test Covers: https://backend-portfolio-production-39a1.up.railway.app/test-cover-image
📁 Static Files: https://backend-portfolio-production-39a1.up.railway.app/uploads/

🎯 Frontend URLs autorisées:
   • http://localhost:5173 (dev)
   • https://portfolio-mu-liart-34.vercel.app (prod)
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
