import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import path from 'path';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'impactpulse_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto',
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Дозволено лише зображення JPEG/PNG та документи PDF!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10 // Increased to 10MB to accommodate PDFs
  },
  fileFilter: fileFilter
});

export default upload;