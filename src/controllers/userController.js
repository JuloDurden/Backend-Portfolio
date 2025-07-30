const User = require('../models/User');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const userController = {
  // GET /api/user - Récupérer les infos user (PUBLIC)
  getUser: async (req, res) => {
    try {
      const user = await User.findOne(); // Un seul utilisateur

      console.log('🔍 USER TROUVÉ:', user ? 'OUI' : 'NON');
      console.log('🔍 USER DATA:', user);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },

  // POST /api/user - Créer utilisateur (PROTÉGÉ)
  createUser: async (req, res) => {
    try {
      const {
        firstName, lastName, email, password, dateOfBirth, githubUrl, profilePicture,
        currentJob, introductionParagraph, journeyParagraph, goalsParagraph, hobbies
      } = req.body;

      // ✅ VÉRIFICATION DES CHAMPS REQUIS (avec password)
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nom, prénom, email et mot de passe sont requis'
        });
      }

      // Vérifier qu'il n'y a pas déjà un utilisateur
      const existingUser = await User.findOne();
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Un utilisateur existe déjà'
        });
      }

      // ✅ INCLURE LE PASSWORD
      const user = new User({
        firstName, lastName, email, password, dateOfBirth, githubUrl, profilePicture,
        currentJob, introductionParagraph, journeyParagraph, goalsParagraph, hobbies
      });

      await user.save();

      // ✅ SUPPRIMER LE PASSWORD DE LA RÉPONSE
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(201).json({
        success: true,
        data: userResponse,
        message: 'Utilisateur créé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },

  // PUT /api/user - Modifier utilisateur (PROTÉGÉ)
  updateUser: async (req, res) => {
    try {
      const {
        firstName, lastName, email, password, dateOfBirth, githubUrl, profilePicture,
        currentJob, introductionParagraph, journeyParagraph, goalsParagraph, hobbies
      } = req.body;

      const user = await User.findOne();
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // ✅ MISE À JOUR AVEC PASSWORD (optionnel en modification)
      const updateData = {
        firstName, lastName, email, dateOfBirth, githubUrl, profilePicture,
        currentJob, introductionParagraph, journeyParagraph, goalsParagraph, hobbies
      };

      // Si un nouveau password est fourni, l'inclure
      if (password) {
        updateData.password = password;
      }

      Object.assign(user, updateData);
      await user.save();

      // ✅ SUPPRIMER LE PASSWORD DE LA RÉPONSE
      const userResponse = user.toObject();
      delete userResponse.password;

      res.json({
        success: true,
        data: userResponse,
        message: 'Utilisateur mis à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },

  // 🔐 NOUVELLE FONCTION - Changer le mot de passe
  changePassword: async (req, res) => {
    try {
      console.log('🔐 Changement de mot de passe demandé');
      
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id || req.user?._id; // Compatible avec votre auth

      console.log('🔍 User ID:', userId);

      // Validation des données
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          success: false,
          message: 'Mot de passe actuel et nouveau mot de passe requis' 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          success: false,
          message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' 
        });
      }

      // Récupérer l'utilisateur avec le mot de passe
      // 🎯 ADAPTATION À VOTRE SYSTÈME (un seul user)
      const user = await User.findOne().select('+password');
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'Utilisateur non trouvé' 
        });
      }

      console.log('✅ Utilisateur trouvé, vérification du mot de passe...');

      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        console.log('❌ Mot de passe actuel incorrect');
        return res.status(400).json({ 
          success: false,
          message: 'Mot de passe actuel incorrect' 
        });
      }

      console.log('✅ Mot de passe actuel validé, hashage du nouveau...');

      // Hasher le nouveau mot de passe
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Mettre à jour le mot de passe
      await User.findByIdAndUpdate(user._id, { 
        password: hashedNewPassword,
        updatedAt: new Date()
      });

      console.log('✅ Mot de passe mis à jour avec succès');

      res.status(200).json({ 
        success: true,
        message: 'Mot de passe modifié avec succès' 
      });

    } catch (error) {
      console.error('❌ Erreur lors du changement de mot de passe:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erreur serveur lors du changement de mot de passe' 
      });
    }
  },

  // PATCH /api/user/avatar - Upload avatar (PROTÉGÉ) - 🔥 CORRIGÉ POUR CLOUDINARY
  updateAvatar: async (req, res) => {
    try {
      console.log('📸 updateAvatar - req.file:', req.file);
      
      const user = await User.findOne();
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier fourni'
        });
      }

      // 🗑️ PAS DE SUPPRESSION LOCAL (Cloudinary gère automatiquement)
      // L'ancien avatar reste sur Cloudinary (pas de problème de stockage)

      // 💾 Récupérer l'URL Cloudinary depuis req.file.path
      const cloudinaryUrl = req.file.path; // URL complète Cloudinary
      console.log('🌟 URL Cloudinary reçue:', cloudinaryUrl);

      // 🔄 Mettre à jour la base avec l'URL Cloudinary
      user.profilePicture = cloudinaryUrl;
      await user.save();

      // ✅ Réponse sans password
      const userResponse = user.toObject();
      delete userResponse.password;

      console.log('✅ Avatar sauvé en base:', userResponse.profilePicture);

      res.json({
        success: true,
        data: userResponse,
        message: 'Avatar mis à jour avec succès',
        avatar: {
          filename: req.file.filename,
          path: cloudinaryUrl,      // 🌟 URL CLOUDINARY COMPLÈTE
          url: cloudinaryUrl,       // 🌟 ALIAS POUR COMPATIBILITÉ
          size: req.file.size,
          public_id: req.file.public_id || req.file.filename
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'avatar:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },

  updatePersonalData: async (req, res) => {
    try {
      console.log('🔍 REQ.BODY updatePersonalData:', req.body);
      
      const user = await User.findOne();
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      console.log('🔍 Utilisateur AVANT modification:', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        githubUrl: user.githubUrl,
        profilePicture: user.profilePicture
      });

      // 🔥 MÊME MÉTHODE QUE POUR ABOUT - Pas de validation complète
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $set: req.body }, // SEULEMENT les champs fournis
        { 
          new: true, 
          runValidators: false, // 🔥 DÉSACTIVER LA VALIDATION COMPLÈTE
          omitUndefined: true   // 🔥 IGNORER LES VALEURS UNDEFINED
        }
      );

      console.log('✅ Utilisateur APRÈS modification:', {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        dateOfBirth: updatedUser.dateOfBirth,
        githubUrl: updatedUser.githubUrl,
        profilePicture: updatedUser.profilePicture
      });

      const userResponse = updatedUser.toObject();
      delete userResponse.password;

      res.json({
        success: true,
        message: 'Données personnelles mises à jour',
        data: userResponse
      });

    } catch (error) {
      console.error('Erreur updatePersonalData:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },

  // 🔥 FONCTION CORRIGÉE - MERGE DES DONNÉES
  updateAboutData: async (req, res) => {
    try {
      console.log('🔍 REQ.BODY updateAboutData:', req.body);
      
      const user = await User.findOne();
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      console.log('🔍 Utilisateur AVANT modification:', {
        currentJob: user.currentJob,
        introductionParagraph: user.introductionParagraph,
        journeyParagraph: user.journeyParagraph,
        goalsParagraph: user.goalsParagraph,
        hobbies: user.hobbies
      });

      // 🎯 MÉTHODE SÛRE - findByIdAndUpdate avec validation partielle
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $set: req.body }, // SEULEMENT les champs fournis
        { 
          new: true, 
          runValidators: false, // 🔥 DÉSACTIVER LA VALIDATION COMPLÈTE
          omitUndefined: true   // 🔥 IGNORER LES VALEURS UNDEFINED
        }
      );

      console.log('✅ Utilisateur APRÈS modification:', {
        currentJob: updatedUser.currentJob,
        introductionParagraph: updatedUser.introductionParagraph,
        journeyParagraph: updatedUser.journeyParagraph,
        goalsParagraph: updatedUser.goalsParagraph,
        hobbies: updatedUser.hobbies
      });

      const userResponse = updatedUser.toObject();
      delete userResponse.password;

      res.json({
        success: true,
        message: 'Section À propos mise à jour',
        data: userResponse
      });

    } catch (error) {
      console.error('Erreur updateAboutData:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
};

module.exports = userController;
