const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['work', 'education'],
    required: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: false, // Facultatif
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: false // Null si en cours
  },
  description: [{
    type: String,
    required: true,
    trim: true
  }],
  technologies: [{
    type: String,
    required: false,
    trim: true
  }],
  image: {
    type: String,
    required: true // ← IMAGE OBLIGATOIRE ✅
  }
}, {
  timestamps: true
});

// Virtual pour calculer le period au format frontend
experienceSchema.virtual('period').get(function() {
  const start = this.startDate.getFullYear();
  const end = this.endDate ? this.endDate.getFullYear() : 'Présent';
  return `${start} - ${end}`;
});

// Inclure les virtuals dans JSON
experienceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Experience', experienceSchema);
