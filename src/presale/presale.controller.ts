import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { UpdatePresaleInfoDto } from './dto/update-presaleInfo.dto';
import { PresaleInfoService } from './presale.service';

import { Express } from 'express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Controller('presales')
export class PresaleController {
  constructor(private readonly service: PresaleInfoService) {}

  @Get()
  async index() {
    return await this.service.findAll();
  }

  @Get(':address')
  async find(@Param('address') address: string) {
    return await this.service.findOne(address);
  }

  @Post()
  async create(@Body() createPresaleInfoDto: UpdatePresaleInfoDto) {
    return await this.service.create(createPresaleInfoDto);
  }

  @Put(':address')
  async udpate(
    @Param('address') address: string,
    @Body() updatePresaleInfoDto: UpdatePresaleInfoDto,
  ) {
    return await this.service.update(address, updatePresaleInfoDto);
  }

  @Delete(':address')
  async delete(@Param('address') address: string) {
    return await this.service.delete(address);
  }

  @Post('upload_presale_logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads_logo',
        filename: function (req, file, cb) {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          let re = /(?:\.([^.]+))?$/;
          cb(
            null,
            file.fieldname +
              '-' +
              uniqueSuffix +
              (re.exec(file.originalname)[1]
                ? '.' + re.exec(file.originalname)[1]
                : ''),
          );
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return file.filename;
  }
}
