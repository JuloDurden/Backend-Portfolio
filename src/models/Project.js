const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, 'L\'ID est requis'],
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  subtitle: {
    type: String,
    required: [true, 'Le sous-titre est requis'],
    trim: true,
    maxlength: [200, 'Le sous-titre ne peut pas dépasser 200 caractères']
  },
  
  cover: {
    small: {
      type: String,
      required: [true, 'L\'image de couverture 400x400 est requise']
    },
    large: {
      type: String,
      required: [true, 'L\'image de couverture 1000x1000 est requise']
    }
  },
  
  description: {
    type: String,
    required: [true, 'La description est requise'],
    maxlength: [5000, 'La description ne peut pas dépasser 5000 caractères']
  },
  
  pictures: [{
    type: String,
    required: true
  }],
  
  competences: [{
    type: String,
    required: true,
    trim: true
  }],
  informations: {
    client: {
      type: String,
      required: [true, 'Le client est requis'],
      trim: true
    },
    date: {
      type: String,
      required: [true, 'La date est requise'],
      trim: true
    }
  },
  links: {
    website: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || v === '' || /^https?:\/\/.+/.test(v);
        },
        message: 'URL du site invalide'
      }
    },
    github: {
      type: String,
      required: [true, 'Le lien GitHub est requis'],
      validate: {
        validator: function(v) {
          return /^https?:\/\/(www\.)?github\.com\/.+/.test(v);
        },
        message: 'URL GitHub invalide'
      }
    }
  },
  technologies: [{
    type: String,
    required: true,
    trim: true
  }],
  featured: {
    type: Boolean,
    default: false
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
projectSchema.index({ featured: -1, order: 1, 'informations.date': -1 });
projectSchema.index({ isVisible: 1 });

// Méthodes existantes
projectSchema.statics.getVisibleProjects = function() {
  return this.find({ isVisible: true }).sort({ featured: -1, order: 1, createdAt: -1 });
};

projectSchema.statics.getFeaturedProjects = function() {
  return this.find({ featured: true, isVisible: true }).sort({ order: 1 });
};

module.exports = mongoose.model('Project', projectSchema);
