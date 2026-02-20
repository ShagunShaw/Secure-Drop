import { HttpException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import ms from 'ms'
import { Model } from 'mongoose';
import { Bundle } from './schema/bundle.schema';
import { InjectModel } from '@nestjs/mongoose';
import { zipFiles } from './utilities/zip.utility';
import { uploadToCloudinary } from './utilities/upload.utility';
import { generateUniqueCode } from './utilities/generateCode.utility';

@Injectable()
export class FileService {
  constructor( @InjectModel(Bundle.name) private bundleModel: Model<Bundle> ) {}

  // Fix: replace the parameters with the dto that we will receive from the controller
  async uploadFile(files: Array<Express.Multer.File>, expiresIn?: string) {
    try{
      // Fix: if it is a single file, upload it as it is else if it is a multiple file, zip it and upload the zip file
      const zipBuffer= await zipFiles(files);

      const result = await uploadToCloudinary(zipBuffer);

      const expiryString = expiresIn || '6h'; 
      const expirationDate = new Date(Date.now() + ms(expiryString as any));

      const bundle = new this.bundleModel({
        accessCode: await generateUniqueCode(this.bundleModel), // Generate a unique access code
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
    catch (error) {
      console.error(`Something went wrong: ${error.message}`);
    
      throw new InternalServerErrorException('Failed to process your files');
    }
  }

  async downloadFile(fileCode: any) {
    try {
      const bundle= await this.bundleModel.findOne({ accessCode: fileCode });

      if(!bundle) {
        throw new HttpException('Forbidden', HttpStatus.NOT_FOUND); 
      }

      if(bundle.expiresAt < new Date()) {
        throw new HttpException('Link has expired', HttpStatus.GONE); 
      }

      return { url: bundle.cloudinaryUrl };
    } 
    catch (error) {
      console.error(`Something went wrong: ${error.message}`);
      throw error;
    }
  }
}
