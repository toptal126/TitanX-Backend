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
}
