const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const multer = require('multer');

// Filtre pour les images uniquement
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées'));
  }
};

// Configuration Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio/projects',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      { quality: 'auto', fetch_format: 'auto' }
    ]
  }
});

// Configuration Multer avec Cloudinary
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: fileFilter
}).fields([
  { name: 'cover', maxCount: 1 },      // 1 cover
  { name: 'pictures', maxCount: 10 }   // Max 10 pictures
]);

/**
 * 🔧 MIDDLEWARE PRINCIPAL : Upload + Processing + URLs Cloudinary
 */
const uploadProjectImages = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: 'Erreur upload',
        error: err.message
      });
    }

    try {
      const uploadedFiles = { covers: {}, pictures: [] };
      
      // 📸 TRAITEMENT DU COVER (2 tailles avec transformations Cloudinary)
      if (req.files && req.files.cover && req.files.cover[0]) {
        const coverFile = req.files.cover[0];
        const baseUrl = coverFile.path; // URL Cloudinary de base
        const publicId = coverFile.filename; // Public ID Cloudinary
        
        // Générer les URLs avec transformations Cloudinary
        uploadedFiles.covers = {
          small: cloudinary.url(publicId, {
            width: 400,
            height: 400,
            crop: 'fill',
            quality: 'auto',
            format: 'webp'
          }),
          large: cloudinary.url(publicId, {
            width: 1000,
            height: 1000,
            crop: 'fill',
            quality: 'auto',
            format: 'webp'
          }),
          publicId: publicId // Pour la suppression future
        };
      }
      
      // 🖼️ TRAITEMENT DES PICTURES
      if (req.files && req.files.pictures) {
        for (const pictureFile of req.files.pictures) {
          const optimizedUrl = cloudinary.url(pictureFile.filename, {
            width: 1200,
            quality: 'auto',
            format: 'webp',
            crop: 'limit'
          });
          
          uploadedFiles.pictures.push({
            url: optimizedUrl,
            publicId: pictureFile.filename
          });
        }
      }
      
      // 🔗 AJOUTER LES URLs À LA REQUEST
      req.uploadedFiles = uploadedFiles;
      
      next(); // Passer au projectController
      
    } catch (error) {
      console.error('Erreur processing images:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement des images',
        error: error.message
      });
    }
  });
};

module.exports = { uploadProjectImages };
