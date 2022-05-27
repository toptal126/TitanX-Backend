import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PairDocument = Pair & Document;

@Schema({ collection: 'bsc' })
export class Pair {
  @Prop({ required: true })
  pairIndex: Number;

  @Prop({ required: true })
  pairAddress: string;

  @Prop({ required: true })
  reserve0: Number;

  @Prop({ required: true })
  reserve1: Number;

  @Prop({ required: true })
  reserve_usd: Number;

  @Prop({ required: true })
  token0: string;

  @Prop({ required: true })
  token0Decimals: Number;

  @Prop({ required: true })
  token0Name: string;

  @Prop({ required: true })
  token0Price: Number;

  @Prop({ required: true })
  token0Symbol: string;

  @Prop({ required: true })
  token1: string;

  @Prop({ required: true })
  token1Decimals: Number;

  @Prop({ required: true })
  token1Name: string;

  @Prop({ required: true })
  token1Price: Number;

  @Prop({ required: true })
  token1Symbol: string;

  @Prop()
  updatedAt?: Date;
}

export const PairSchema = SchemaFactory.createForClass(Pair);
