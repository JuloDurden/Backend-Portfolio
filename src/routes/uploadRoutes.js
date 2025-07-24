// Routes pour l'upload
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const UploadController = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

// Protection : toutes les routes nécessitent une auth
router.use(protect);

// Upload cover projet (1 fichier)
router.post('/project-cover', 
  upload.single('cover'), 
  UploadController.uploadCover
);

// Upload images projet (plusieurs fichiers)
router.post('/project-pictures', 
  upload.array('pictures', 10), // Max 10 images
  UploadController.uploadPictures
);

// Upload icône skill (1 fichier)
router.post('/skill-icon', 
  upload.single('icon'), 
  UploadController.uploadSkillIcon
);

module.exports = router;
