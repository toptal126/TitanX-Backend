import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProfileDto, VerifyProfileDto } from './dto/profile.dto';
import { Profile, ProfileDocument } from './schema/profile.schema';
import { v4 as uuidv4 } from 'uuid';
import { PresaleInfo, PresaleInfoDocument } from './schema/presaleInfo.schema';

@Injectable()
export class ProfileService {
  private web3;
  constructor(
    @InjectModel(Profile.name)
    private readonly model: Model<ProfileDocument>,
    @InjectModel(PresaleInfo.name)
    private readonly presaleModel: Model<PresaleInfoDocument>,
  ) {
    const Web3 = require('web3');
    this.web3 = new Web3();
  }

  async findAll(): Promise<Profile[]> {
    return await this.model.find().exec();
  }
  async findOne(id: string): Promise<Profile> {
    return await this.model.findById(id).exec();
  }
  async findOneByWallet(wallet: string): Promise<ProfileDocument> {
    return await this.model.findOne({ wallet }).exec();
  }
  async create(createProfileDto: CreateProfileDto): Promise<Profile> {
    try {
      const checksummedWallet = this.web3.utils.toChecksumAddress(
        createProfileDto.wallet,
      );
      const presaleNumber = await this.presaleModel
        .find({ owner: checksummedWallet })
        .count();
      return await this.model.create({
        ...createProfileDto,
        presaleNumber,
        username: createProfileDto.wallet,
        uuid: uuidv4(),
        wallet: checksummedWallet,
        createdAt: new Date(),
      });
    } catch (error) {
      if (error.code === 11000)
        throw new HttpException(
          'Duplicate wallet or username!',
          HttpStatus.BAD_REQUEST,
        );
      throw new HttpException('Bad Request!', HttpStatus.BAD_REQUEST);
    }
  }

  async getNonceByWallet(wallet: string): Promise<string> {
    const existingObj = await this.findOneByWallet(wallet);
    if (existingObj) return existingObj.uuid;
    // else create and return uuid
    const createdOne = await this.create({ wallet });
    return createdOne.uuid;
  }
  async verifySignatureHash(
    verifyProfileDto: VerifyProfileDto,
  ): Promise<Profile> {
    const existingObj = await this.findOneByWallet(verifyProfileDto.wallet);
    const recovered = this.web3.eth.accounts.recover(
      existingObj.uuid,
      verifyProfileDto.signatureHash,
    );
    if (recovered === existingObj.wallet) {
      existingObj.verified = true;
      await existingObj.save();
    }
    return existingObj;
  }
}
