import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateProfileDto, VerifyProfileDto } from './dto/profile.dto';

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

  @Get('nonce/:wallet')
  async getNonceByWallet(@Param('wallet') wallet: string) {
    return await this.service.getNonceByWallet(wallet);
  }

  @Get('me/:wallet')
  async getOneByWallet(@Param('wallet') wallet: string) {
    return await this.service.findOneByWallet(wallet);
  }

  @Post()
  async create(@Body() createProfileDto: CreateProfileDto) {
    return await this.service.create(createProfileDto);
  }
  @Post('verify')
  async verify(@Body() verifyProfileDto: VerifyProfileDto) {
    return await this.service.verifySignatureHash(verifyProfileDto);
    console.log(verifyProfileDto);
  }
}
