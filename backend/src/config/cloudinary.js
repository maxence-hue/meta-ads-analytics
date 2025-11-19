const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper pour upload
const uploadImage = async (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: options.folder || 'meta-ads',
                resource_type: 'auto',
                transformation: options.transformation || [],
                ...options
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        
        uploadStream.end(buffer);
    });
};

// Helper pour delete
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Erreur suppression Cloudinary:', error);
        throw error;
    }
};

// Helper pour optimisation automatique
const getOptimizedUrl = (publicId, options = {}) => {
    return cloudinary.url(publicId, {
        fetch_format: 'auto',
        quality: 'auto',
        ...options
    });
};

module.exports = {
    cloudinary,
    uploadImage,
    deleteImage,
    getOptimizedUrl
};
