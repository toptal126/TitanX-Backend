import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdatePresaleInfoDto } from './dto/update-presaleInfo.dto';
import { PresaleInfo, PresaleInfoDocument } from './schema/presaleInfo.schema';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Injectable()
export class PresaleInfoService {
  constructor(
    @InjectModel(PresaleInfo.name)
    private readonly model: Model<PresaleInfoDocument>,
  ) {}

  async create(
    createPresaleInfoDto: UpdatePresaleInfoDto,
  ): Promise<PresaleInfo> {
    return await new this.model({
      ...createPresaleInfoDto,
      createdAt: new Date(),
    }).save();
  }

  async findAll(): Promise<PresaleInfo[]> {
    return await this.model.find().exec();
  }

  async findOne(address: string): Promise<PresaleInfo> {
    return await this.model.findOne({ address: address });
  }
  async update(
    address: string,
    updatePresaleInfoDto: UpdatePresaleInfoDto,
  ): Promise<PresaleInfo> {
    return await this.model
      .findOneAndUpdate({ address: address }, updatePresaleInfoDto, {
        returnDocument: 'after',
      })
      .exec();
  }

  async delete(address: string): Promise<PresaleInfo> {
    return await this.model.findOneAndDelete({ address: address }).exec();
  }
}
