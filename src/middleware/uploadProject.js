const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

// Configuration de stockage temporaire
const storage = multer.memoryStorage();

// Filtre pour les images uniquement
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées'));
  }
};

// Configuration Multer
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter
}).fields([
  { name: 'cover', maxCount: 1 },      // 1 cover
  { name: 'pictures', maxCount: 10 }   // Max 10 pictures
]);

/**
 * 🔧 MIDDLEWARE PRINCIPAL : Upload + Processing + Paths
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
      const uploadedFiles = { covers: [], pictures: [] };
      
      // 📸 TRAITEMENT DU COVER (2 tailles)
      if (req.files && req.files.cover && req.files.cover[0]) {
        const coverFile = req.files.cover[0];
        const projectId = req.body.id || uuidv4();
        const baseFilename = `${projectId}_cover`;
        
        // ✅ CHEMIN CORRIGÉ : uploads/projects/covers
        const coverDir = path.join(__dirname, '..', 'uploads', 'projects', 'covers');
        if (!fs.existsSync(coverDir)) {
          fs.mkdirSync(coverDir, { recursive: true });
        }
        
        // Générer les 2 tailles de cover
        const sizes = [
          { suffix: '_400', width: 400, height: 400 },
          { suffix: '_1000', width: 1000, height: 1000 }
        ];
        
        for (const size of sizes) {
          const filename = `${baseFilename}${size.suffix}.webp`;
          const filePath = path.join(coverDir, filename);
          // ✅ WEB PATH CORRIGÉ
          const webPath = `/uploads/projects/covers/${filename}`;
          
          await sharp(coverFile.buffer)
            .resize(size.width, size.height, { fit: 'cover' })
            .webp({ quality: 85 })
            .toFile(filePath);
          
          uploadedFiles.covers.push(webPath);
        }
      }
      
      // 🖼️ TRAITEMENT DES PICTURES
      if (req.files && req.files.pictures) {
        const projectId = req.body.id || uuidv4();
        
        // ✅ CHEMIN CORRIGÉ : uploads/projects/pictures
        const picturesDir = path.join(__dirname, '..', 'uploads', 'projects', 'pictures');
        if (!fs.existsSync(picturesDir)) {
          fs.mkdirSync(picturesDir, { recursive: true });
        }
        
        for (let i = 0; i < req.files.pictures.length; i++) {
          const pictureFile = req.files.pictures[i];
          const filename = `${projectId}_pic_${i + 1}_${uuidv4()}.webp`;
          const filePath = path.join(picturesDir, filename);
          // ✅ WEB PATH CORRIGÉ
          const webPath = `/uploads/projects/pictures/${filename}`;
          
          await sharp(pictureFile.buffer)
            .resize(1200, null, { 
              fit: 'inside',
              withoutEnlargement: true
            })
            .webp({ quality: 85 })
            .toFile(filePath);
          
          uploadedFiles.pictures.push(webPath);
        }
      }
      
      // 🔗 AJOUTER LES CHEMINS À LA REQUEST
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
