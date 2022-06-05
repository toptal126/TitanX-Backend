import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CoinPriceDocument = CoinPrice & Document;

@Schema({ collection: 'bsc', versionKey: false })
export class CoinPrice {
  @Prop({ required: true })
  timeStamp: number;

  @Prop({ required: true })
  fromBlock: number;

  @Prop({ required: true })
  toBlock: number;

  @Prop({ required: true })
  usdPrice: number;

  @Prop({ required: true })
  updatedAt: number;
}

export const CoinPriceSchema = SchemaFactory.createForClass(CoinPrice);
