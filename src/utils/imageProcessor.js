// Traitement des images avec Sharp - Version Ultra Optimisée
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class ImageProcessor {
  
  // Configuration Sharp optimisée
  static getSharpConfig() {
    return {
      // Effort maximal pour la compression
      effort: 6,              // 0-6, 6 = effort maximal
      quality: 90,            // Qualité élevée
      progressive: true,      // Chargement progressif
      // Optimisation couleurs
      palette: false,         // Pas de palette limitée
      smartSubsample: true,   // Sous-échantillonnage intelligent
      // Réduction taille maximale
      nearLossless: false,    // Compression avec perte pour + petite taille
      alphaQuality: 90        // Qualité canal alpha
    };
  }
  
  // Traitement cover projet (2 tailles)
  static async processCover(buffer, filename) {
    const uuid = uuidv4();
    const timestamp = Date.now();
    const baseName = `${uuid}-${timestamp}`;
    
    const paths = {
      small: `public/uploads/projects/covers/400x400/${baseName}.webp`,
      large: `public/uploads/projects/covers/1000x1000/${baseName}.webp`
    };
    
    const urls = {
      small: `/uploads/projects/covers/400x400/${baseName}.webp`,
      large: `/uploads/projects/covers/1000x1000/${baseName}.webp`
    };
    
    try {
      console.log('🖼️ Traitement cover:', filename);
      
      // Configuration optimisée
      const config = this.getSharpConfig();
      
      // Cover 400x400 - Plus compressée pour les cartes
      await sharp(buffer)
        .resize(400, 400, { 
          fit: 'inside', 
          withoutEnlargement: true,
          kernel: sharp.kernel.lanczos3  // Meilleur algorithme resize
        })
        .webp({ 
          ...config,
          quality: 85,  // Un peu moins pour les petites
          effort: 6     // Effort maximal
        })
        .toFile(paths.small);
      
      // Cover 1000x1000 - Qualité maximale
      await sharp(buffer)
        .resize(1000, 1000, { 
          fit: 'inside', 
          withoutEnlargement: true,
          kernel: sharp.kernel.lanczos3
        })
        .webp({ 
          ...config,
          quality: 92,  // Qualité maximale
          effort: 6     // Effort maximal
        })
        .toFile(paths.large);
      
      console.log('✅ Cover traitée avec succès');
      return urls;
      
    } catch (error) {
      console.error('❌ Erreur traitement cover:', error);
      throw error;
    }
  }
  
  // Traitement image projet normale
  static async processPicture(buffer, filename) {
    const uuid = uuidv4();
    const timestamp = Date.now();
    const baseName = `${uuid}-${timestamp}`;
    
    const filePath = `public/uploads/projects/pictures/${baseName}.webp`;
    const url = `/uploads/projects/pictures/${baseName}.webp`;
    
    try {
      console.log('🖼️ Traitement picture:', filename);
      
      const config = this.getSharpConfig();
      
      await sharp(buffer)
        .resize(1000, 1000, { 
          fit: 'inside', 
          withoutEnlargement: true,
          kernel: sharp.kernel.lanczos3  // Meilleur algorithme
        })
        .webp({ 
          ...config,
          quality: 92,  // Qualité maximale pour les images projet
          effort: 6     // Effort maximal
        })
        .toFile(filePath);
      
      console.log('✅ Picture traitée avec succès');
      return url;
      
    } catch (error) {
      console.error('❌ Erreur traitement picture:', error);
      throw error;
    }
  }
  
  // Traitement icône skill (optimisation légère)
  static async processSkillIcon(buffer, filename, mimetype) {
    const uuid = uuidv4();
    const timestamp = Date.now();
    const extension = mimetype === 'image/svg+xml' ? 'svg' : 'png';
    const baseName = `${uuid}-${timestamp}.${extension}`;
    
    const filePath = `public/uploads/skills/${baseName}`;
    const url = `/uploads/skills/${baseName}`;
    
    try {
      console.log('🎨 Traitement skill icon:', filename);
      
      // Pour SVG, on sauvegarde direct (pas de traitement)
      if (mimetype === 'image/svg+xml') {
        await fs.writeFile(filePath, buffer);
        console.log('✅ SVG sauvegardé directement');
      } else {
        // Pour PNG, optimisation maximale
        await sharp(buffer)
          .png({ 
            quality: 100,         // Qualité max pour icônes
            compressionLevel: 9,  // Compression maximale
            progressive: true,    // Chargement progressif
            palette: true,        // Palette optimisée pour icônes
            effort: 10            // Effort maximal PNG
          })
          .toFile(filePath);
        
        console.log('✅ PNG optimisé avec succès');
      }
      
      return url;
      
    } catch (error) {
      console.error('❌ Erreur traitement skill:', error);
      throw error;
    }
  }
  
  // Méthode utilitaire pour analyser l'image avant traitement
  static async analyzeImage(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      console.log('📊 Analyse image:', {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: `${Math.round(buffer.length / 1024)}KB`,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha
      });
      return metadata;
    } catch (error) {
      console.error('❌ Erreur analyse image:', error);
      return null;
    }
  }
  
  // Méthode pour nettoyer les anciens fichiers (bonus)
  static async cleanupOldFiles(directory, maxAgeHours = 24) {
    try {
      const files = await fs.readdir(directory);
      const now = Date.now();
      let cleaned = 0;
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        const ageHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);
        
        if (ageHours > maxAgeHours) {
          await fs.unlink(filePath);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        console.log(`🧹 Nettoyage: ${cleaned} fichiers supprimés`);
      }
      
    } catch (error) {
      console.error('❌ Erreur nettoyage:', error);
    }
  }
}

module.exports = ImageProcessor;
