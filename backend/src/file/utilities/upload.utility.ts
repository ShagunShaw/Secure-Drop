import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import * as streamifier from 'streamifier';

export const uploadToCloudinary = async (buffer: Buffer): Promise<UploadApiResponse> => {

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw', // IMPORTANT: Must be 'raw' for .zip files
          public_id: `bundles/${uuidv4()}.zip`, // Organize in a folder with unique name
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Upload failed: no result returned'));
          resolve(result);
        },
      );

      // We use streamifier to turn our Buffer into a Readable Stream
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }