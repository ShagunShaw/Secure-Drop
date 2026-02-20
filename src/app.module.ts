import { Module } from '@nestjs/common';
import { FileModule } from './file/file.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/nest'),
    MulterModule.register({
  storage: memoryStorage(), // This ensures 'file.buffer' exists!
}),
    FileModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
