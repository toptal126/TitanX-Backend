import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MetaTxDocument = MetaTx & Document;

@Schema({ collection: 'ethereum' })
export class MetaTx {
  @Prop({ required: true })
  from: string;

  @Prop({ required: true })
  to: string;

  data?: any;

  @Prop({ required: true })
  nonce: string;

  gasLimit?: any;

  gasPrice?: any;

  txResult?: any;

  @Prop({ required: true })
  createdAt: Date;
}

export const MetaTxSchema = SchemaFactory.createForClass(MetaTx);
