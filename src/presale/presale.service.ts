import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdatePresaleInfoDto } from './dto/update-presaleInfo.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { PresaleInfo, PresaleInfoDocument } from './schema/presaleInfo.schema';
import { Partner, PartnerDocument } from './schema/partner.schema';

@Injectable()
export class PresaleInfoService {
  constructor(
    @InjectModel(PresaleInfo.name)
    private readonly model: Model<PresaleInfoDocument>,

    @InjectModel(Partner.name)
    private readonly partner_model: Model<PartnerDocument>,
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
    return await this.model.findOne({ address: { $regex: `${address}`, $options: 'i' } });
  }
  async update(
    address: string,
    updatePresaleInfoDto: UpdatePresaleInfoDto,
  ): Promise<PresaleInfo> {
    return await this.model
      .findOneAndUpdate({ address: { $regex: `${address}`, $options: 'i' } }, updatePresaleInfoDto, {
        returnDocument: 'after',
      })
      .exec();
  }

  async delete(address: string): Promise<PresaleInfo> {
    return await this.model.findOneAndDelete({ address: { $regex: `${address}`, $options: 'i' } }).exec();
  }

  async findOnePartner(address: string): Promise<Partner> {
    return await this.partner_model.findOne({ address: { $regex: `${address}`, $options: 'i' } });
  }

  async create_partner(createPartnerDto: UpdatePartnerDto): Promise<Partner> {
    return await new this.partner_model({
      ...createPartnerDto,
      createdAt: new Date(),
    }).save();
  }

  async update_partner(
    address: string,
    updatePartnerDto: UpdatePartnerDto,
  ): Promise<Partner> {
    return await this.partner_model
      .findOneAndUpdate({ address: { $regex: `${address}`, $options: 'i' } }, updatePartnerDto, {
        returnDocument: 'after',
      })
      .exec();
  }
}
