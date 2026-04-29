import { v2 as cloudinary } from "cloudinary";
import config from "../config/index.js";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const uploadBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "bildyapp",
        resource_type: options.resourceType || "auto",
        public_id: options.publicId,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
};

const deleteFile = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

export default { uploadBuffer, deleteFile };
