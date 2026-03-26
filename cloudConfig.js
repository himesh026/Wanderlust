const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

// Custom Multer storage engine for Cloudinary v2
// Replaces multer-storage-cloudinary (which only supports cloudinary v1)
class CloudinaryStorage {
    constructor({ cloudinary, params }) {
        this.cloudinary = cloudinary;
        this.params = params;
    }

    _handleFile(req, file, cb) {
        const uploadStream = this.cloudinary.uploader.upload_stream(
            {
                folder: this.params.folder,
                allowed_formats: this.params.allowed_formats,
            },
            (error, result) => {
                if (error) return cb(error);
                cb(null, {
                    filename: result.public_id,
                    path: result.secure_url,
                    size: result.bytes,
                });
            }
        );

        // Pipe the incoming file stream into Cloudinary's upload stream
        file.stream.pipe(uploadStream);
    }

    _removeFile(req, file, cb) {
        this.cloudinary.uploader.destroy(file.filename, cb);
    }
}

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'wanderlust_DEV',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

module.exports = { cloudinary, storage };
