const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ SKILLS CONFIGURATION
const skillStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio/skills',
    allowed_formats: ['svg', 'png', 'jpg', 'jpeg', 'webp'],
    resource_type: 'auto',
    transformation: [
      { width: 100, height: 100, crop: 'fit', format: 'auto' }
    ]
  }
});

const skillFileFilter = (req, file, cb) => {
  console.log('🔍 SKILL FILE FILTER:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/svg+xml',
    'image/webp',
    'image/gif'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    console.log('✅ Fichier accepté');
    cb(null, true);
  } else {
    console.log('❌ Fichier rejeté - type non supporté');
    cb(new Error('Format de fichier non autorisé. Utilisez: JPG, PNG, SVG, WEBP, GIF'), false);
  }
};

const uploadSkillBase = multer({ 
  storage: skillStorage,
  fileFilter: skillFileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
});

// Wrapper avec logs pour skills
const uploadSkillWithLogs = (req, res, next) => {
  console.log('🚀 UPLOAD SKILL START');
  console.log('📝 Content-Type:', req.headers['content-type']);
  
  uploadSkillBase.single('icon')(req, res, (err) => {
    if (err) {
      console.error('❌ UPLOAD ERROR:', err.message);
      return res.status(400).json({
        success: false,
        message: `Erreur upload: ${err.message}`
      });
    }
    
    console.log('✅ UPLOAD SUCCESS:', req.file ? 'File uploaded' : 'No file');
    if (req.file) {
      console.log('📎 File details:', {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size
      });
    }
    next();
  });
};

// ✅ EXPERIENCES CONFIGURATION
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

const uploadExperience = multer({ storage: experienceStorage });

// ✅ PROJECTS CONFIGURATION
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

const uploadProjectCover = multer({ storage: projectCoverStorage });  
const uploadProjectPictures = multer({ storage: projectPictureStorage });

// ✅ EXPORTS
module.exports = {
  cloudinary,
  uploadSkill: uploadSkillWithLogs,
  uploadExperience,
  uploadProjectCover,
  uploadProjectPictures
};
