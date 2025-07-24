const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 📁 Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/avatars';
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // avatar-timestamp.extension
    const uniqueName = `avatar-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 🔍 Filtrage des fichiers (images seulement)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Seules les images (JPEG, JPG, PNG, GIF, WEBP) sont autorisées'));
  }
};

// ⚙️ Configuration multer
const uploadAvatar = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: fileFilter
}).single('avatar'); // Un seul fichier avec le nom 'avatar'

module.exports = uploadAvatar;
