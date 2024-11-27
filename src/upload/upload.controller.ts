import { Controller, Post, Body, UseInterceptors, UploadedFiles, Get, Req } from '@nestjs/common';
import { UploadService } from './upload.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    ) { }

  @Post()
  @UseInterceptors(AnyFilesInterceptor({
    storage: diskStorage({
      destination: 'uploads/',
      filename: function (req, file, cb) {
        // cb(null, file.originalname)
        cb(null, Date.now() + extname(file.originalname))
      }
    })
  }))
  uploadFile(@UploadedFiles() file: Express.Multer.File[], @Body('id') id: string) {
    this.uploadService.setFile({ id,path: file[0].filename, mimetype: file[0].mimetype, size:file[0].size });
    return "ok"
  };
}
