import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreateProfileDto,
  UpdateProfileDto,
  VerifyProfileDto,
} from './dto/profile.dto';
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
  async updateOneByWallet(
    wallet: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    const existingObj = await this.findOneByWallet(wallet);

    const recovered = this.web3.eth.accounts.recover(
      existingObj.uuid,
      updateProfileDto.signatureHash,
    );
    if (recovered === existingObj.wallet) {
      existingObj.username = updateProfileDto.username;
      existingObj.bio = updateProfileDto.bio;
      existingObj.avatarLink = updateProfileDto.avatarLink;
      existingObj.bannerLink = updateProfileDto.bannerLink;
      existingObj.verified = true;
      await existingObj.save();
    }
    return existingObj;
  }
  async findOneByWallet(wallet: string): Promise<ProfileDocument> {
    return await this.model.findOne({ wallet }).exec();
  }
  async findOneByUsername(username: string): Promise<ProfileDocument> {
    return await this.model.findOne({ username }).exec();
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
  async toggleFollowing(username: string, wallet: string): Promise<Profile> {
    const [existingObj, follower] = await Promise.all([
      this.findOneByUsername(username),
      this.findOneByWallet(wallet),
    ]);
    if (!follower) {
      throw new HttpException('Invalid account!', HttpStatus.BAD_REQUEST);
    }
    if (!existingObj) {
      throw new HttpException(
        'Invalid profile to follow!',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (follower.wallet === existingObj.wallet) {
      throw new HttpException("Can't follow self!", HttpStatus.BAD_REQUEST);
    }

    const indexOfFollowerWallet: number = existingObj.followers.indexOf(wallet);
    if (indexOfFollowerWallet >= 0)
      existingObj.followers.splice(indexOfFollowerWallet, 1);
    else existingObj.followers.push(wallet);

    const indexOfFollowingWallet: number = follower.following.indexOf(
      existingObj.wallet,
    );
    if (indexOfFollowingWallet >= 0)
      follower.following.splice(indexOfFollowingWallet, 1);
    else follower.following.push(existingObj.wallet);

    await Promise.all([existingObj.save(), follower.save()]);
    return existingObj;
  }
  async followersData(username: string): Promise<Profile[]> {
    const existingObj = await this.findOneByUsername(username);
    if (!existingObj) {
      throw new HttpException(
        'Invalid request for non-existing profile!',
        HttpStatus.BAD_REQUEST,
      );
    }
    const followersProfiles = await this.model
      .find({
        wallet: { $in: existingObj.followers },
      })
      .select({
        username: 1,
        bio: 1,
        avatarLink: 1,
        wallet: 1,
      })
      .exec();
    return followersProfiles;
  }
  async followingData(username: string): Promise<Profile[]> {
    const existingObj = await this.findOneByUsername(username);
    if (!existingObj) {
      throw new HttpException(
        'Invalid request for non-existing profile!',
        HttpStatus.BAD_REQUEST,
      );
    }
    const followingProfiles = await this.model
      .find({
        wallet: { $in: existingObj.following },
      })
      .select({
        username: 1,
        bio: 1,
        avatarLink: 1,
        wallet: 1,
      })
      .exec();
    return followingProfiles;
  }
}
