import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  CreateProfileDto,
  UpdateClientLocationDto,
  UpdateProfileDto,
  VerifyProfileDto,
} from './dto/profile.dto';

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

  @Put(':wallet')
  async updateOneByWallet(
    @Param('wallet') wallet: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return await this.service.updateOneByWallet(wallet, updateProfileDto);
  }
  @Put('clientinfo/:wallet')
  async updateClientInfoByWallet(
    @Param('wallet') wallet: string,
    @Body() updateProfileDto: UpdateClientLocationDto,
  ) {
    return await this.service.updateClientInfoByWallet(
      wallet,
      updateProfileDto,
    );
  }

  @Get('nonce/:wallet')
  async getNonceByWallet(@Param('wallet') wallet: string) {
    return await this.service.getNonceByWallet(wallet);
  }

  @Get('me/:wallet')
  async getOneByWallet(@Param('wallet') wallet: string) {
    return await this.service.findProfileByWallet(wallet);
  }
  @Get('u/:username')
  async getOneByUsername(@Param('username') username: string) {
    return await this.service.findOneByUsername(username);
  }

  @Post()
  async create(@Body() createProfileDto: CreateProfileDto) {
    return await this.service.create(createProfileDto);
  }
  @Post('verify')
  async verify(@Body() verifyProfileDto: VerifyProfileDto) {
    return await this.service.verifySignatureHash(verifyProfileDto);
  }
  @Put('follow/:username/:wallet')
  async toggleFollowing(
    @Param('username') username: string,
    @Param('wallet') wallet: string,
  ) {
    return await this.service.toggleFollowing(username, wallet);
  }
  @Get('followers/:username')
  async followersData(@Param('username') username: string) {
    return await this.service.followersData(username);
  }
  @Get('following/:username')
  async followingData(@Param('username') username: string) {
    return await this.service.followingData(username);
  }

  @Get('assets/:wallet')
  async fetchAssetsByWallet(@Param('wallet') wallet: string) {
    return await this.service.fetchAssetsByWallet(wallet);
  }

  @Put('assets/:wallet')
  async updateAssetsByWallet(@Param('wallet') wallet: string) {
    return await this.service.updateAssetsByWallet(wallet);
  }

  @Get('suggested/:wallet')
  async suggestedProfiles(@Param('wallet') wallet: string) {
    return await this.service.getSuggestedProfiles(wallet);
  }
}
