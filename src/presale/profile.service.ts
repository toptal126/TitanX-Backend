import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProfileDto } from './dto/profile.dto';
import { Profile, ProfileDocument } from './schema/profile.schema';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name)
    private readonly model: Model<ProfileDocument>,
  ) {}

  async findAll(): Promise<Profile[]> {
    return await this.model.find().exec();
  }
  async findOne(id: string): Promise<Profile> {
    return await this.model.findById(id).exec();
  }
  async create(createProfileDto: CreateProfileDto): Promise<Profile> {
    return await this.model
      .findOneAndUpdate(
        { wallet: createProfileDto.wallet },
        { ...createProfileDto, createdAt: new Date() },
        {
          returnDocument: 'after',
          upsert: true,
        },
      )
      .exec();
  }
}
