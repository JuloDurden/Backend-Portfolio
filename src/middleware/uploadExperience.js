const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

// Configuration de stockage temporaire
const storage = multer.memoryStorage();

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

// Middleware de traitement des images
const processExperienceImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    // Créer le dossier s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'uploads', 'experiences');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Générer un nom unique
    const filename = `experience-${uuidv4()}.webp`;
    const filepath = path.join(uploadDir, filename);

    // Traitement avec Sharp - Logo optimisé 400x400
    await sharp(req.file.buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ 
        quality: 90,
        effort: 6  // Effort maximal
      })
      .toFile(filepath);

    // ✅ HARMONISATION: Créer req.uploadedFiles comme le controller l'attend
    req.uploadedFiles = {
      image: `experiences/${filename}` // ← Chemin relatif pour MongoDB
    };
    
    console.log('✅ Image traitée:', req.uploadedFiles.image);
    
    next();
  } catch (error) {
    console.error('Erreur lors du traitement de l\'image:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement de l\'image'
    });
  }
};

// Fonction utilitaire pour supprimer une image
const deleteExperienceImage = (imagePath) => {
  if (!imagePath) return;
  
  try {
    // imagePath = "experiences/filename.webp"
    const fullPath = path.join(process.cwd(), 'uploads', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`✅ Image supprimée: ${imagePath}`);
    }
  } catch (error) {
    console.error('❌ Erreur suppression image:', error);
  }
};

module.exports = {
  uploadSingle: upload.single('image'), // ✅ CHANGÉ: 'photo' → 'image'
  processExperienceImage,
  deleteExperienceImage
};
