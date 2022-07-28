import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Document, Types } from 'mongoose';

export type ProfileDocument = Profile & Document;

@Schema()
export class Profile {
  @Prop({ required: true, unique: true })
  username: string;
  @Prop({ required: true, unique: true })
  wallet: string;
  @Prop({ required: true, default: false })
  verified: boolean;

  @Prop({ required: true })
  uuid: string;

  @Prop({ required: true, default: 0 })
  articleNumber: number;

  @Prop({ required: true, default: 0 })
  presaleNumber: number;

  @Prop({ required: true, default: [] })
  followers: Array<Types.ObjectId>;
  @Prop({ required: true, default: [] })
  following: Array<Types.ObjectId>;

  @Prop({ required: true, default: false })
  featured: boolean;

  @Prop({ required: true, default: 0 })
  totalContribution: number;

  @Prop({ required: true })
  createdAt: Date;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
