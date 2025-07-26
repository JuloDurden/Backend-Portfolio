const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// Configuration Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio/experiences',
    format: async (req, file) => 'webp',
    public_id: (req, file) => `experience_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    transformation: [
      { width: 400, height: 400, crop: 'fill', quality: 'auto:good' }
    ]
  }
});

// Filtrage des types de fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format non supporté. Utilisez JPG, JPEG, PNG ou WEBP'), false);
  }
};

// Configuration multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: fileFilter
});

// Middleware de traitement des images Cloudinary
const processExperienceImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    // Créer l'objet uploadedFiles avec l'URL Cloudinary
    req.uploadedFiles = {
      image: req.file.path, // URL Cloudinary complète
      publicId: req.file.filename // Public ID pour la suppression
    };
    
    console.log('✅ Image Experience uploadée sur Cloudinary:', req.uploadedFiles.image);
    
    next();
  } catch (error) {
    console.error('Erreur lors du traitement de l\'image:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement de l\'image'
    });
  }
};

// Fonction utilitaire pour supprimer une image de Cloudinary
const deleteExperienceImage = async (imageUrl) => {
  if (!imageUrl) return;
  
  try {
    // Extraire le public_id à partir de l'URL Cloudinary
    const publicId = extractPublicId(imageUrl);
    
    if (publicId) {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log(`✅ Image Cloudinary supprimée:`, result);
    }
  } catch (error) {
    console.error('❌ Erreur suppression image Cloudinary:', error);
  }
};

// Fonction pour extraire le public_id d'une URL Cloudinary
const extractPublicId = (url) => {
  try {
    if (!url || typeof url !== 'string') return null;
    
    // Pattern pour extraire le public_id d'une URL Cloudinary
    const match = url.match(/\/portfolio\/experiences\/([^/.]+)/);
    return match ? `portfolio/experiences/${match[1]}` : null;
  } catch (error) {
    console.error('Erreur extraction public_id:', error);
    return null;
  }
};

module.exports = {
  uploadSingle: upload.single('image'),
  processExperienceImage,
  deleteExperienceImage
};
