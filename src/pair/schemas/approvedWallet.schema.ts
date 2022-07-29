import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApprovedWalletDocument = ApprovedWallet & Document;

@Schema({ collection: 'approved-wallet' })
export class ApprovedWallet {
  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  createdAt: Date;
}

export const ApprovedWalletSchema =
  SchemaFactory.createForClass(ApprovedWallet);
