import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateProfileDto } from './dto/profile.dto';

import { ProfileService } from './profile.service';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get()
  async index() {
    return await this.service.findAll();
  }

  @Get(':id')
  async getOneById(@Param('id') id: string) {
    return await this.service.findOne(id);
  }

  @Post()
  async create(@Body() createProfileDto: CreateProfileDto) {
    return await this.service.create(createProfileDto);
  }
}
