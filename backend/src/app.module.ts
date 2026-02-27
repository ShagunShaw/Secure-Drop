import { Module } from '@nestjs/common';
import { FileModule } from './file/file.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConfigModule } from '@nestjs/config'; // For .env support
import { CloudinaryModule } from './configurations/cloudinary.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',        // This is the default rate limiter which you must define to confine your Rate Limiter. If over any route, we didn't mention @SkipThrottle() or ovveride this throttle using @Throttle() or using any custom throttle decorator, then this rate limiter is automatically applied to that route with the parameters mentioned here i.e. only 3 requests per 1000 milisecond from a single user
          ttl: 1000,
          limit: 3,
        },
      ],
    }),
    ScheduleModule.forRoot(), // This "turns on" the clock
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(`${process.env.MONGODB_URL}`),
    CloudinaryModule,
    MulterModule.register({
      storage: memoryStorage(), // This ensures 'file.buffer' exists!
      limits: {        // It stops the upload immediately if a single file is too huge
        fileSize: 5 * 1024 * 1024, 
      }
    }),
    FileModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
