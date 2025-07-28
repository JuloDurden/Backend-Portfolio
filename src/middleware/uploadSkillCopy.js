const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const multer = require('multer');

// Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio/skills',
    allowed_formats: ['jpg', 'png', 'gif', 'svg', 'jpeg', 'webp'],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      return `skill_${uniqueSuffix}`;
    },
    transformation: [
      { width: 500, height: 500, crop: 'limit', quality: 'auto' }
    ]
  },
});

// Filtre des fichiers (même logique qu'avant)
const fileFilter = (req, file, cb) => {
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

// Configuration multer avec Cloudinary
const uploadSkill = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
  fileFilter: fileFilter
});

module.exports = uploadSkill;
