const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // PersonalData
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Par défaut, password n'est pas inclus dans les requêtes
  },
  
  dateOfBirth: {
    type: String,
    required: true
  },
  githubUrl: {
    type: String,
    required: true,
    trim: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  
  // AboutData
  currentJob: {
    type: String,
    required: true,
    trim: true
  },
  introductionParagraph: {
    type: String,
    required: true
  },
  journeyParagraph: {
    type: String,
    required: true
  },
  goalsParagraph: {
    type: String,
    required: true
  },
  hobbies: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// 🔒 Middleware pour hasher le password avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 🔑 Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
