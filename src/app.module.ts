import { Module } from '@nestjs/common';
import { FileModule } from './file/file.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConfigModule } from '@nestjs/config'; // For .env support
import { CloudinaryModule } from './configurations/cloudinary.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(`${process.env.MONGODB_URL}`),
    CloudinaryModule,
    MulterModule.register({
  storage: memoryStorage(), // This ensures 'file.buffer' exists!
}),
    FileModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
