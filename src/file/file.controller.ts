import { Controller, Get, Post, Param, UploadedFiles, UseInterceptors, Res, InternalServerErrorException } from '@nestjs/common';
import type { Response } from 'express';
import { FileService } from './file.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { MultipleFilesValidationPipe } from './validation/file.validation_pipe';
import axios from 'axios';

@Controller('file')
export class FileController {
    constructor(private readonly fileService: FileService) {}

    @Post('upload')
    @UseInterceptors(AnyFilesInterceptor())
    // yha pe time limit wala parameter bhi pass karna hoga
    uploadFile(@UploadedFiles(MultipleFilesValidationPipe) files: Array<Express.Multer.File>) {
        const result= this.fileService.uploadFile(files);
        // response.status(201).send()
        return result;
    }


    @Get('download/:filecode')
    async getFile(@Param() param: any, @Res() res: Response) {
        const bundle = await this.fileService.downloadFile(param.filecode);

        try {
            res.set({
                'Content-Type': 'application/zip', // Adjust based on file type
                'Content-Disposition': `attachment; filename="bundle-${param.filecode}.zip"`,
            });

            const response = await axios({      // You need a way for your server to "act like a browser" and fetch the file from Cloudinary internally, thats why we are using axio
                url: bundle.url,
                method: 'GET',
                responseType: 'stream',
            });

            response.data.pipe(res);

            response.data.on('error', (err) => {
            console.error('Stream error:', err);
            res.end(); 
            });
        }
        catch (error) {
            throw new InternalServerErrorException('Could not reach the file storage');
        }
    }
}