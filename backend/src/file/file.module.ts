import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { Bundle, BundleSchema } from './schema/bundle.schema';
import { TasksService } from './task.service';


@Module({
  imports: [MongooseModule.forFeature([{ name: Bundle.name, schema: BundleSchema }])],
  controllers: [FileController],
  providers: [FileService, TasksService],
})
export class FileModule {}
