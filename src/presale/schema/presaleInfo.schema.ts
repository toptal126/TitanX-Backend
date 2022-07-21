import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PresaleInfoDocument = PresaleInfo & Document;

@Schema()
export class PresaleInfo {
  @Prop()
  address: string;

  @Prop()
  owner: string;

  @Prop()
  tokenAddress?: string;

  @Prop()
  hardCap?: number;

  @Prop()
  presaleRate?: number;
  @Prop()
  listingRate?: number;
  @Prop()
  minContribution?: number;
  @Prop()
  maxContribution?: number;
  @Prop()
  liquidityPercentage?: number;
  @Prop()
  liquidityLockupTime?: number;
  @Prop()
  presaleStartTime?: number;
  @Prop()
  presaleEndTime?: number;

  @Prop()
  kycLink?: string;

  @Prop()
  auditLink?: string;

  @Prop()
  external_links?: Array<{
    name: string;
    link: string;
  }>;

  @Prop()
  description?: string;

  @Prop()
  update?: string;

  @Prop({ default: [] })
  likes?: Array<string>;

  @Prop({ required: true })
  createdAt: Date;

  @Prop()
  deletedAt?: Date;
}

export const PresaleInfoSchema = SchemaFactory.createForClass(PresaleInfo);
