import { Buffer } from 'buffer';
import { Writable } from 'stream';
import archiver from 'archiver';

export const zipFiles = async (files: Express.Multer.File[]): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      // Create a writable stream to capture the zip data
      const writableStream = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk);
          callback();
        },
      });

      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.on('error', (err) => reject(err));
      
      // When the archiver is done, concatenate all chunks into one Buffer
      archive.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      // Pipe the archive data to our writable stream
      archive.pipe(writableStream);

      // Add each file to the zip
      files.forEach((file) => {
        archive.append(file.buffer, { name: file.originalname });
      });

      // Signal that we are done adding files
      archive.finalize();
    });
}
