// 📸 IMPORT DEPUIS CLOUDINARY CONFIG
const { uploadAvatar } = require('../config/cloudinary');

// 🚀 EXPORT DIRECT DU MULTER CLOUDINARY
module.exports = uploadAvatar.single('avatar');
