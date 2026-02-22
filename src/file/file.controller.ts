import { Controller, Get, Post, Param, UploadedFiles, UseInterceptors, Res, InternalServerErrorException, Body, HttpCode } from '@nestjs/common';
import { FileService } from './file.service';
import type { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MultipleFilesValidationPipe } from './validation/file.validation_pipe';
import axios from 'axios';

@Controller('file')
export class FileController {
    constructor(private readonly fileService: FileService) {}

    @Post('upload')
    @HttpCode(201) // Explicitly set the status code if every goes right
    @UseInterceptors(FilesInterceptor('files'))     // 'files' must match the Key in Postman. And if we want to add some other data with the files, we must use the @Body() decorator
    uploadFile(@UploadedFiles(MultipleFilesValidationPipe) files: Array<Express.Multer.File>,
               @Body('timeLimit') limit?: string) {    // Using '?' makes it optional and clearer
        const hour= Number(limit)  ||  6;
        const timeLimit= hour + 'h';

        const result= this.fileService.uploadFile(files, timeLimit);
        return {
            status: 201,
            message: "File uploaded successfully",
            data: result
        };
    }


    @Get('download/:filecode')
    @HttpCode(200)
    async getFile(@Param('filecode') filecode: string, @Res() res: Response) {
        const bundle = await this.fileService.downloadFile(filecode);

        try {
            res.set({
                'Content-Type': 'application/zip', // Adjust based on file type
                'Content-Disposition': `attachment; filename="bundle-${filecode}.zip"`,
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