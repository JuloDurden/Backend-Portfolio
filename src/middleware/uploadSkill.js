const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier de destination s'il n'existe pas
const uploadDir = 'uploads/skills';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Format: skill_timestamp_random.ext
    const uniqueSuffix = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const filename = 'skill_' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

// Filtre des fichiers
const fileFilter = (req, file, cb) => {
  // Types MIME autorisés pour les icônes
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/svg+xml',
    'image/webp'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non autorisé. Utilisez: JPG, PNG, SVG, WEBP'), false);
  }
};

// Configuration multer
const uploadSkill = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max pour les icônes
  },
  fileFilter: fileFilter
});

module.exports = uploadSkill;
