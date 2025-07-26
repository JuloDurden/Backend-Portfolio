const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage pour les skills
const skillStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio/skills',
    allowed_formats: ['jpg', 'png', 'gif', 'svg', 'jpeg', 'webp'],
    public_id: (req, file) => `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  },
});

// Storage pour les projects covers
const projectCoverStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio/projects/covers',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
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
    transformation: [
      { width: 1200, height: 800, crop: 'limit', quality: 'auto' }
    ],
    public_id: (req, file) => `${req.body.id || Date.now()}_pic_${Date.now()}`,
  },
});

// Multer configs
const uploadSkill = multer({ storage: skillStorage });
const uploadProjectCover = multer({ storage: projectCoverStorage });  
const uploadProjectPictures = multer({ storage: projectPictureStorage });

module.exports = {
  cloudinary,
  uploadSkill,
  uploadProjectCover,
  uploadProjectPictures
};
