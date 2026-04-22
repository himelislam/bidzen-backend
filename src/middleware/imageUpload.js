const multer = require('multer');
const { storage } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

// Configure multer for multiple image upload
const uploadMultipleImages = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per image
    files: 10 // Maximum 10 images
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'), false);
    }
  }
}).array('images', 10); // Maximum 10 images

const handleImageUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, 'File size too large. Maximum size is 5MB per image.'));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new ApiError(400, 'Too many files. Maximum 10 images allowed.'));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new ApiError(400, 'Unexpected file field.'));
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return next(new ApiError(400, error.message));
  }
  
  next(error);
};

module.exports = { uploadMultipleImages, handleImageUploadErrors };
