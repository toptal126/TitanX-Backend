import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdatePresaleInfoDto } from './dto/update-presaleInfo.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { PresaleInfo, PresaleInfoDocument } from './schema/presaleInfo.schema';
import { Partner, PartnerDocument } from './schema/partner.schema';
import { Profile, ProfileDocument } from './schema/profile.schema';

@Injectable()
export class PresaleInfoService {
  constructor(
    @InjectModel(PresaleInfo.name)
    private readonly model: Model<PresaleInfoDocument>,

    @InjectModel(Partner.name)
    private readonly partner_model: Model<PartnerDocument>,

    @InjectModel(Profile.name)
    private readonly profile_model: Model<ProfileDocument>,
  ) {}

  async create(
    createPresaleInfoDto: UpdatePresaleInfoDto,
  ): Promise<PresaleInfo> {
    const [ownerProfile, createdPresale] = await Promise.all([
      this.profile_model.findOne({ wallet: createPresaleInfoDto.owner }).exec(),
      new this.model({
        ...createPresaleInfoDto,
        createdAt: new Date(),
      }).save(),
    ]);
    if (!ownerProfile) {
      await new this.profile_model({
        wallet: createPresaleInfoDto.owner,
        presaleNumber: 1,
        createdAt: new Date(),
        exp: 1000,
      }).save();
    } else {
      ownerProfile.presaleNumber += 1;
      ownerProfile.exp += 1000;
      await ownerProfile.save();
    }
    return createdPresale;
  }

  async findAll(): Promise<PresaleInfo[]> {
    return await this.model.find().exec();
  }

  async findOne(address: string): Promise<PresaleInfo> {
    return await this.model.findOne({
      address: { $regex: `${address}`, $options: 'i' },
    });
  }
  async presalesByOwner(
    chainId: number,
    owner: string,
  ): Promise<PresaleInfo[]> {
    return await this.model.find({ chainId, owner }).exec();
  }
  async likeToggle(address: string, wallet: string): Promise<PresaleInfo> {
    const presale = await this.model.findOne({
      address: { $regex: `${address}`, $options: 'i' },
    });
    if (!presale) {
      return await new this.model({
        address,
        createdAt: new Date(),
        likes: [wallet],
      }).save();
    }
    const indexOfWallet: number = presale.likes.indexOf(wallet);
    if (indexOfWallet >= 0) presale.likes.splice(indexOfWallet, 1);
    else presale.likes.push(wallet);
    await presale.save();
    return presale;
  }
  async update(
    address: string,
    updatePresaleInfoDto: UpdatePresaleInfoDto,
  ): Promise<PresaleInfo> {
    updatePresaleInfoDto.address = address;
    return await this.model
      .findOneAndUpdate(
        { address: { $regex: `${address}`, $options: 'i' } },
        { ...updatePresaleInfoDto, createdAt: new Date() },
        {
          returnDocument: 'after',
          upsert: true,
        },
      )
      .exec();
  }

  async delete(address: string): Promise<PresaleInfo> {
    return await this.model
      .findOneAndDelete({ address: { $regex: `${address}`, $options: 'i' } })
      .exec();
  }

  async findOnePartner(address: string): Promise<Partner> {
    return await this.partner_model.findOne({
      address: { $regex: `${address}`, $options: 'i' },
    });
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
      .findOneAndUpdate(
        { address: { $regex: `${address}`, $options: 'i' } },
        updatePartnerDto,
        {
          returnDocument: 'after',
          upsert: true,
        },
      )
      .exec();
  }

  async upcomingPresales(): Promise<PresaleInfo[]> {
    console.log(new Date().getTime() / 1000);
    return await this.model
      .find({ presaleStartTime: { $gt: new Date().getTime() / 1000 } })
      .exec();
  }
}
