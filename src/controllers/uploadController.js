// Controller pour l'upload d'images - Version Optimisée
const ImageProcessor = require('../utils/imageProcessor'); // ✅ minuscule comme ton fichier
const mime = require('mime-types');
const path = require('path');
const fs = require('fs').promises;

class UploadController {
  
  // Validation des types MIME pour projets
  static validateProjectImage(mimetype) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    return allowedTypes.includes(mimetype);
  }
  
  // Validation des types MIME pour skills
  static validateSkillIcon(mimetype) {
    const allowedTypes = ['image/svg+xml', 'image/png'];
    return allowedTypes.includes(mimetype);
  }
  
  // Upload cover projet (1 fichier → 2 tailles WebP)
  static async uploadCover(req, res) {
    try {
      // Vérification fichier
      if (!req.file) {
        return res.status(400).json({ 
          error: 'Aucun fichier cover fourni',
          code: 'NO_FILE'
        });
      }
      
      const { originalname, mimetype, buffer, size } = req.file;
      
      console.log('📸 Upload cover:', {
        filename: originalname,
        mimetype: mimetype,
        size: `${Math.round(size / 1024)}KB`
      });
      
      // Validation type MIME
      if (!UploadController.validateProjectImage(mimetype)) {
        return res.status(400).json({ 
          error: `Type de fichier non autorisé pour cover: ${mimetype}`,
          code: 'INVALID_MIME_TYPE',
          allowed: ['image/jpeg', 'image/png']
        });
      }
      
      // Validation taille (10MB max)
      if (size > 10 * 1024 * 1024) {
        return res.status(400).json({ 
          error: 'Fichier trop volumineux (10MB maximum)',
          code: 'FILE_TOO_LARGE',
          size: `${Math.round(size / 1024 / 1024)}MB`
        });
      }
      
      // Traitement avec Sharp
      console.log('🔄 Traitement cover en cours...');
      const startTime = Date.now();
      
      const coverUrls = await ImageProcessor.processCover(buffer, originalname);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Cover traitée en ${processingTime}ms`);
      
      // Réponse succès
      res.json({
        success: true,
        message: 'Cover uploadée avec succès',
        cover: coverUrls,
        metadata: {
          originalName: originalname,
          originalSize: `${Math.round(size / 1024)}KB`,
          processingTime: `${processingTime}ms`,
          outputFormat: 'webp',
          sizes: ['400x400', '1000x1000']
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur upload cover:', error);
      res.status(500).json({ 
        error: 'Erreur serveur lors du traitement de la cover',
        code: 'PROCESSING_ERROR',
        details: error.message
      });
    }
  }
  
  // Upload images projet (plusieurs fichiers → WebP optimisé)
  static async uploadPictures(req, res) {
    try {
      // Vérification fichiers
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          error: 'Aucun fichier image fourni',
          code: 'NO_FILES'
        });
      }
      
      console.log(`📸 Upload ${req.files.length} picture(s)`);
      
      // Traitement en parallèle
      const startTime = Date.now();
      const results = [];
      const errors = [];
      
      for (const file of req.files) {
        try {
          const { originalname, mimetype, buffer, size } = file;
          
          console.log(`🔄 Traitement: ${originalname}`);
          
          // Validation type MIME
          if (!UploadController.validateProjectImage(mimetype)) {
            errors.push({
              filename: originalname,
              error: `Type non autorisé: ${mimetype}`
            });
            continue;
          }
          
          // Validation taille
          if (size > 10 * 1024 * 1024) {
            errors.push({
              filename: originalname,
              error: `Fichier trop volumineux: ${Math.round(size / 1024 / 1024)}MB`
            });
            continue;
          }
          
          // Traitement
          const pictureUrl = await ImageProcessor.processPicture(buffer, originalname);
          
          results.push({
            original: originalname,
            url: pictureUrl,
            size: `${Math.round(size / 1024)}KB`
          });
          
        } catch (error) {
          console.error(`❌ Erreur traitement ${file.originalname}:`, error);
          errors.push({
            filename: file.originalname,
            error: error.message
          });
        }
      }
      
      const totalProcessingTime = Date.now() - startTime;
      console.log(`✅ Traitement terminé: ${results.length}/${req.files.length} succès en ${totalProcessingTime}ms`);
      
      // Réponse avec détails
      const response = {
        success: results.length > 0,
        message: `${results.length}/${req.files.length} image(s) uploadée(s)`,
        pictures: results,
        metadata: {
          totalFiles: req.files.length,
          successCount: results.length,
          errorCount: errors.length,
          totalProcessingTime: `${totalProcessingTime}ms`,
          outputFormat: 'webp',
          size: '1000x1000'
        },
        details: results,
        errors: errors.length > 0 ? errors : undefined
      };
      
      // Status code selon résultats
      const statusCode = results.length === req.files.length ? 200 : 
                        results.length > 0 ? 207 : // Partial success
                        400; // All failed
      
      res.status(statusCode).json(response);
      
    } catch (error) {
      console.error('❌ Erreur upload pictures:', error);
      res.status(500).json({ 
        error: 'Erreur serveur lors du traitement des images',
        code: 'PROCESSING_ERROR',
        details: error.message
      });
    }
  }
  
  // Upload icône skill (1 fichier → direct ou PNG optimisé)
  static async uploadSkillIcon(req, res) {
    try {
      // Vérification fichier
      if (!req.file) {
        return res.status(400).json({ 
          error: 'Aucune icône fournie',
          code: 'NO_FILE'
        });
      }
      
      const { originalname, mimetype, buffer, size } = req.file;
      
      console.log('🎨 Upload skill icon:', {
        filename: originalname,
        mimetype: mimetype,
        size: `${Math.round(size / 1024)}KB`
      });
      
      // Validation type MIME
      if (!UploadController.validateSkillIcon(mimetype)) {
        return res.status(400).json({ 
          error: `Type de fichier non autorisé pour icône: ${mimetype}`,
          code: 'INVALID_MIME_TYPE',
          allowed: ['image/svg+xml', 'image/png']
        });
      }
      
      // Validation taille (2MB max pour les icônes)
      if (size > 2 * 1024 * 1024) {
        return res.status(400).json({ 
          error: 'Icône trop volumineux (2MB maximum)',
          code: 'FILE_TOO_LARGE',
          size: `${Math.round(size / 1024 / 1024)}MB`
        });
      }
      
      // Traitement
      console.log('🔄 Traitement icône en cours...');
      const startTime = Date.now();
      
      const iconUrl = await ImageProcessor.processSkillIcon(buffer, originalname, mimetype);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Icône traitée en ${processingTime}ms`);
      
      // Réponse succès
      res.json({
        success: true,
        message: 'Icône uploadée avec succès',
        icon: iconUrl,
        metadata: {
          originalName: originalname,
          originalSize: `${Math.round(size / 1024)}KB`,
          processingTime: `${processingTime}ms`,
          format: mimetype === 'image/svg+xml' ? 'svg' : 'png',
          optimized: mimetype !== 'image/svg+xml'
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur upload skill icon:', error);
      res.status(500).json({ 
        error: 'Erreur serveur lors du traitement de l\'icône',
        code: 'PROCESSING_ERROR',
        details: error.message
      });
    }
  }
  
  // ✅ CLEANUP CORRIGÉ - VERSION FONCTIONNELLE
  static async cleanup(req, res) {
    try {
      console.log('🧹 CLEANUP - Début du nettoyage...');
      
      const { filesToKeep = [] } = req.body;
      
      console.log('📋 Fichiers à garder:', filesToKeep);

      // 🔧 CORRECTION : Chemin sans "src"
      const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
      
      // 🔍 Debug du chemin
      console.log('📁 Chemin uploads:', uploadsDir);
      
      // Vérifier que le dossier existe
      try {
        const stats = await fs.stat(uploadsDir);
        if (!stats.isDirectory()) {
          throw new Error('Le chemin uploads n\'est pas un dossier');
        }
        console.log('✅ Dossier uploads trouvé !');
      } catch (pathError) {
        console.error('❌ Dossier uploads introuvable:', uploadsDir);
        return res.status(500).json({
          success: false,
          message: 'Dossier uploads introuvable',
          path: uploadsDir,
          error: pathError.message
        });
      }

      const deletedFiles = [];
      const keptFiles = [];
      let totalSize = 0;

      // Fonction récursive pour parcourir tous les dossiers
      const scanDirectory = async (dirPath) => {
        try {
          const items = await fs.readdir(dirPath, { withFileTypes: true });
          
          for (const item of items) {
            const fullPath = path.join(dirPath, item.name);
            
            if (item.isDirectory()) {
              // Récursion dans les sous-dossiers
              await scanDirectory(fullPath);
            } else if (item.isFile()) {
              // Convertir le chemin en URL relative (compatible Windows/Linux)
              const relativePath = fullPath
                .replace(path.join(__dirname, '..', '..', 'public'), '') // 🔧 CORRECTION
                .replace(/\\/g, '/');
              
              console.log(`📁 Fichier trouvé: ${relativePath}`);
              
              // Vérifier si le fichier doit être gardé
              const shouldKeep = filesToKeep.some(keepFile => keepFile === relativePath);
              
              if (shouldKeep) {
                keptFiles.push(relativePath);
                console.log(`✅ GARDÉ: ${relativePath}`);
              } else {
                // Supprimer le fichier
                try {
                  const stats = await fs.stat(fullPath);
                  totalSize += stats.size;
                  
                  await fs.unlink(fullPath);
                  deletedFiles.push(relativePath);
                  console.log(`🗑️ SUPPRIMÉ: ${relativePath}`);
                } catch (deleteError) {
                  console.error(`❌ Erreur suppression ${relativePath}:`, deleteError.message);
                }
              }
            }
          }
        } catch (readError) {
          console.error(`❌ Erreur lecture dossier ${dirPath}:`, readError.message);
        }
      };

      // Scanner tous les uploads
      await scanDirectory(uploadsDir);

      // Formater la taille
      const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      };

      console.log(`🎯 RÉSULTAT CLEANUP: ${deletedFiles.length} supprimés, ${keptFiles.length} gardés`);
      console.log(`💾 Espace libéré: ${formatSize(totalSize)}`);

      res.json({
        success: true,
        message: 'Nettoyage effectué avec succès',
        data: {
          deletedFiles,
          keptFiles,
          totalDeleted: deletedFiles.length,
          totalKept: keptFiles.length,
          spaceFreed: formatSize(totalSize)
        }
      });

    } catch (error) {
      console.error('❌ Erreur cleanup:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors du nettoyage',
        error: error.message
      });
    }
  }
}

module.exports = UploadController;
