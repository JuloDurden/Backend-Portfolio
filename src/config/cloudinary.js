const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔧 STORAGE POUR LES SKILLS (CORRIGÉ)
const skillStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    console.log('📁 Processing file:', file.mimetype);
    
    return {
      folder: 'portfolio/skills',
      resource_type: 'image', // ✅ Toujours image
      allowed_formats: ['svg', 'png', 'jpg', 'jpeg', 'webp'],
      public_id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transformation: [
        { 
          width: 100, 
          height: 100, 
          crop: 'fit',
          quality: 'auto',
          flags: file.mimetype === 'image/svg+xml' ? 'sanitize' : undefined
        }
      ]
    };
  }
});


// Filtre des fichiers pour les skills
const skillFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/svg+xml', // ✅ Important pour SVG
    'image/webp',
    'image/gif'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non autorisé. Utilisez: JPG, PNG, SVG, WEBP, GIF'), false);
  }
};

// Storage pour les experiences
const experienceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio/experiences',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    resource_type: 'image',
    transformation: [
      { width: 400, height: 400, crop: 'fill', quality: 'auto:good' }
    ],
    public_id: (req, file) => `experience_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  },
});

// Storage pour les projects covers
const projectCoverStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio/projects/covers',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    resource_type: 'image',
    transformation: [
      { width: 1000, height: 1000, crop: 'limit', quality: 'auto' }
    ],
    public_id: (req, file) => `${req.body.id || Date.now()}_cover`,
  },
});

// Storage pour les projects pictures  
const projectPictureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio/projects/pictures',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    resource_type: 'image',
    transformation: [
      { width: 1200, height: 800, crop: 'limit', quality: 'auto' }
    ],
    public_id: (req, file) => `${req.body.id || Date.now()}_pic_${Date.now()}`,
  },
});

// 🔧 MULTER CONFIGS (AVEC FILTRES)
const uploadSkill = multer({ 
  storage: skillStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1
  },
  fileFilter: skillFileFilter
});

const uploadExperience = multer({ storage: experienceStorage });
const uploadProjectCover = multer({ storage: projectCoverStorage });  
const uploadProjectPictures = multer({ storage: projectPictureStorage });

module.exports = {
  cloudinary,
  uploadSkill,
  uploadExperience,
  uploadProjectCover,
  uploadProjectPictures
};
