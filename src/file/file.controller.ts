import { Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileService } from './file.service';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { MultipleFilesValidationPipe } from './validation/file.validation_pipe';

@Controller('file')
export class FileController {
    constructor(private readonly fileService: FileService) {}

    @Post('upload')
    @UseInterceptors(AnyFilesInterceptor())
    uploadFile(@UploadedFiles(MultipleFilesValidationPipe) files: Array<Express.Multer.File>) {
        return this.fileService.uploadFile(files);
    }
}
