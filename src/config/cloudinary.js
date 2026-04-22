const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const config = require('./env');

// Validate Cloudinary credentials are present
const cloudName = config.cloudinary.cloudName;
const apiKey = config.cloudinary.apiKey;
const apiSecret = config.cloudinary.apiSecret;

console.log('Cloudinary config loading:', {
  cloudName: cloudName ? 'SET' : 'MISSING',
  apiKey: apiKey ? 'SET' : 'MISSING',
  apiSecret: apiSecret ? 'SET' : 'MISSING'
});

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error(
    'Cloudinary credentials are required for image upload. Please set:\n' +
    'CLOUDINARY_CLOUD_NAME\n' +
    'CLOUDINARY_API_KEY\n' +
    'CLOUDINARY_API_SECRET\n' +
    'in your environment variables.'
  );
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

console.log('Cloudinary configured successfully');

// Use memory storage and manual upload to Cloudinary
const storage = multer.memoryStorage();

console.log('Memory storage configured (manual Cloudinary upload)');

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = async (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const publicId = `auction-${uniqueSuffix}`;

    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        public_id: publicId,
        folder: 'bidzen/auctions',
        format: 'jpg',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Cloudinary upload successful:', publicId);
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

module.exports = { cloudinary, storage, uploadToCloudinary };
