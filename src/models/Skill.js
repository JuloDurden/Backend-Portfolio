const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, 'L\'ID est requis'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  level: {
    type: String,
    required: [true, 'Le niveau est requis'],
    enum: {
      values: ['Débutant', 'Junior', 'Senior'],
      message: 'Le niveau doit être: Débutant, Junior ou Senior'
    }
  },
  icon: {
    type: String,
    required: [true, 'L\'icône est requise'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'L\'icône doit être une URL valide'
    }
  },
  categories: [{
    type: String,
    required: true,
    trim: true,
    enum: {
      values: [
        'Web', 'Front-end', 'Back-end', 'Design', 'Tools', 'Frameworks', 
        'Scripting', 'Database', 'Operating System', 'Software', 
        'UX/UI', 'Workflow', 'Cloud', '3D'
      ],
      message: 'Catégorie non autorisée'
    }
  }],
  // Champs additionnels pour l'administration
  isVisible: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
skillSchema.index({ categories: 1, level: 1 });
skillSchema.index({ isVisible: 1, featured: -1, order: 1 });

// Méthode pour obtenir les skills par catégorie
skillSchema.statics.getByCategory = function(category) {
  return this.find({ 
    categories: category, 
    isVisible: true 
  }).sort({ featured: -1, order: 1, name: 1 });
};

// Méthode pour obtenir les skills par niveau
skillSchema.statics.getByLevel = function(level) {
  return this.find({ 
    level: level, 
    isVisible: true 
  }).sort({ featured: -1, order: 1, name: 1 });
};

// Méthode pour obtenir toutes les skills visibles
skillSchema.statics.getVisibleSkills = function() {
  return this.find({ isVisible: true }).sort({ featured: -1, order: 1, name: 1 });
};

// Méthode pour obtenir les compétences principales
skillSchema.statics.getFeaturedSkills = function() {
  return this.find({ featured: true, isVisible: true }).sort({ order: 1 });
};

module.exports = mongoose.model('Skill', skillSchema);
