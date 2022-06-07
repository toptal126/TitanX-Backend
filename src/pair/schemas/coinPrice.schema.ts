import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CoinPriceDocument = CoinPrice & Document;

@Schema({ collection: 'bsc', versionKey: false })
export class CoinPrice {
  constructor(t?: CoinPrice) {
    if (t) {
      this.timeStamp = t.timeStamp;
      this.fromBlock = t.fromBlock;
      this.toBlock = t.toBlock;
      this.usdPrice = t.usdPrice;
      this.updatedAt = t.updatedAt;
    }
  }
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
