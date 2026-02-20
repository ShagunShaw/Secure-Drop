import path from 'path';
import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class MultipleFilesValidationPipe implements PipeTransform {
  transform(files: Express.Multer.File[]) {

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const blockedMimeTypes = [
      'application/x-sh',           // .sh
      'application/x-msdownload',   // .exe
      'application/x-bat',          // .bat
    ];

    const blockedExtensions = ['.sh', '.bat', '.exe'];

    const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
    let totalSize = 0;

    files.forEach(file => {

      const ext = path.extname(file.originalname).toLowerCase();
      if (blockedExtensions.includes(ext)) {
        throw new BadRequestException(
          `${file.originalname} has a blocked extension`,
        );
      }

      totalSize += file.size;

      if (totalSize > MAX_TOTAL_SIZE) {
        throw new BadRequestException(
          `Total file size exceeds the limit of 50MB`,
        );
      }      

    });

    return files;
  }
}
