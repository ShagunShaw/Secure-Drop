import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bundle } from './schema/bundle.schema';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(Bundle.name) private bundleModel: Model<Bundle>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredFiles() {
    this.logger.debug('Janitor: Starting cleanup of expired files...');

    const expiredBundles = await this.bundleModel.find({
      expiresAt: { $lt: new Date() },
    });

    if (expiredBundles.length === 0) {
      this.logger.debug('Janitor: No expired files found.');
      return;
    }

    for (const bundle of expiredBundles) {
      try {
        // Delete from Cloudinary using the stored PublicID
        await cloudinary.uploader.destroy(`${bundle.cloudinaryPublicId}`, 
          { resource_type: "raw" }      // For deleting any file other than images in cloudinary, we need to specify it's 'resource_type'
        );

        // Delete from MongoDB
        await this.bundleModel.deleteOne({ _id: bundle._id });

        this.logger.log(`Janitor: Deleted expired bundle ${bundle.accessCode}`);
      } 
      catch (error) {
        this.logger.error(`Janitor: Failed to delete ${bundle.accessCode}`, error.stack);
      }
    }

    this.logger.debug('Janitor: Cleanup finished.');
  }
}