import { Injectable } from '@nestjs/common';
import { Writable } from 'stream';
import archiver from 'archiver';
import { Buffer } from 'buffer';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid'; 
import * as streamifier from 'streamifier'; 
import ms from 'ms'
import { Model } from 'mongoose';
import { Bundle } from './schema/bundle.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class FileService {
  constructor( @InjectModel(Bundle.name) private bundleModel: Model<Bundle> ) {}

  private async zipFiles(files: Express.Multer.File[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      // Create a writable stream to capture the zip data
      const writableStream = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk);
          callback();
        },
      });

      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.on('error', (err) => reject(err));
      
      // When the archiver is done, concatenate all chunks into one Buffer
      archive.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      // Pipe the archive data to our writable stream
      archive.pipe(writableStream);

      // Add each file to the zip
      files.forEach((file) => {
        archive.append(file.buffer, { name: file.originalname });
      });

      // Signal that we are done adding files
      archive.finalize();
    });
  }

  private async uploadToCloudinary(buffer: Buffer): Promise<UploadApiResponse> {

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

  private async generateUniqueCode(): Promise<string> {
    const code = uuidv4().split('-')[0];
  
    const exists = await this.bundleModel.findOne({ accessCode: code });
    if (exists) {
      return this.generateUniqueCode();
    }

    return code;
  }

  // Fix: replace the parameters with the dto that we will receive from the controller
  async uploadFile(files: Array<Express.Multer.File>, expiresIn?: string) {
    // Fix: if it is a single file, upload it as it is else if it is a multiple file, zip it and upload the zip file
    const zipBuffer= await this.zipFiles(files);

    const result = await this.uploadToCloudinary(zipBuffer);

    const expiryString = expiresIn || '6h'; 
    const expirationDate = new Date(Date.now() + ms(expiryString as any));

    const bundle = new this.bundleModel({
      accessCode: await this.generateUniqueCode(),
      cloudinaryUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      expiresAt: expirationDate,
    });

    await bundle.save();

    return {
      message: 'File(s) uploaded successfully',
      accessCode: bundle.accessCode,
      url: bundle.cloudinaryUrl,
      expiresAt: bundle.expiresAt,
    };
  }

  getFile() {
    
  }
}
