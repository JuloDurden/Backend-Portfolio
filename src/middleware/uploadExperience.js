const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const { cloudinary } = require('../config/cloudinary'); // ✅ DESTRUCTURING AJOUTÉ

// Configuration Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio/experiences',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: (req, file) => `experience_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    transformation: [
      { width: 400, height: 400, crop: 'fill', quality: 'auto:good' }
    ]
  }
});

// Filtrage des types de fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  console.log('🔍 Fichier reçu:', { // ✅ DEBUG AJOUTÉ
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.error('❌ Format non supporté:', file.mimetype); // ✅ DEBUG
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
const processExperienceImage = (req, res, next) => {
  console.log('🔍 processExperienceImage appelé'); // ✅ DEBUG
  
  if (!req.file) {
    console.log('ℹ️ Aucun fichier uploadé'); // ✅ DEBUG
    return next();
  }

  try {
    // Vérifier que req.file contient les bonnes propriétés
    console.log('📁 req.file:', { // ✅ DEBUG DÉTAILLÉ
      path: req.file.path,
      filename: req.file.filename,
      originalname: req.file.originalname
    });

    // Créer l'objet uploadedFiles avec l'URL Cloudinary
    req.uploadedFiles = {
      image: req.file.path, // URL Cloudinary complète
      publicId: req.file.filename // Public ID pour la suppression
    };

    // 🔍 DEBUG : VÉRIFIER L'URL CLOUDINARY BRUTE
    console.log('🔍 ANALYSE req.file.path:');
    console.log('  - Path brut:', JSON.stringify(req.file.path));
    console.log('  - Type:', typeof req.file.path);
    console.log('  - Longueur:', req.file.path?.length);
    console.log('  - 10 derniers chars:', req.file.path?.slice(-10));
    
    next();
  } catch (error) {
    console.error('❌ Erreur lors du traitement de l\'image:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement de l\'image',
      error: error.message // ✅ DÉTAIL ERREUR AJOUTÉ
    });
  }
};

// Fonction utilitaire pour supprimer une image de Cloudinary
const deleteExperienceImage = async (imageUrl) => {
  if (!imageUrl) {
    console.log('ℹ️ Aucune URL fournie pour suppression');
    return;
  }
  
  try {
    console.log('🗑️ Tentative suppression image:', imageUrl); // ✅ DEBUG
    
    // Extraire le public_id à partir de l'URL Cloudinary
    const publicId = extractPublicId(imageUrl);
    
    if (publicId) {
      console.log('🔍 Public ID extrait:', publicId); // ✅ DEBUG
      const result = await cloudinary.uploader.destroy(publicId);
      console.log('✅ Image Cloudinary supprimée:', result);
      return result;
    } else {
      console.error('❌ Impossible d\'extraire le public_id de:', imageUrl);
    }
  } catch (error) {
    console.error('❌ Erreur suppression image Cloudinary:', error);
    throw error;
  }
};

// Fonction pour extraire le public_id d'une URL Cloudinary
const extractPublicId = (url) => {
  try {
    if (!url || typeof url !== 'string') {
      console.log('❌ URL invalide pour extraction:', url);
      return null;
    }
    
    console.log('🔍 Extraction public_id de:', url); // ✅ DEBUG
    
    // Pattern amélioré pour extraire le public_id d'une URL Cloudinary
    // Format typique: https://res.cloudinary.com/cloud/image/upload/v123456/portfolio/experiences/experience_123.webp
    const match = url.match(/\/portfolio\/experiences\/([^/.]+)/);
    const publicId = match ? `portfolio/experiences/${match[1]}` : null;
    
    console.log('✅ Public ID extrait:', publicId); // ✅ DEBUG
    return publicId;
  } catch (error) {
    console.error('❌ Erreur extraction public_id:', error);
    return null;
  }
};

module.exports = {
  uploadSingle: upload.single('image'),
  processExperienceImage,
  deleteExperienceImage
};
