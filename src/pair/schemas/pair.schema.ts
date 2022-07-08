import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PairDocument = Pair & Document;

@Schema({ collection: 'bsc' })
export class Pair {
  @Prop({ required: true, default: 0 })
  dexId?: number;

  @Prop({ required: true, default: -1 })
  pairIndex?: number;

  @Prop({ required: true, index: true })
  pairAddress: string;

  @Prop({ required: true })
  reserve0: number;

  @Prop({ required: true })
  reserve1: number;

  @Prop({ required: true })
  reserve_usd: number;

  @Prop({ required: true })
  token0: string;

  @Prop({ required: true })
  token0Decimals: number;

  @Prop({ required: true })
  token0Name: string;

  @Prop({ required: true })
  token0Price: number;

  @Prop({ required: true })
  token0Symbol: string;

  @Prop({ required: true })
  token1: string;

  @Prop({ required: true })
  token1Decimals: number;

  @Prop({ required: true })
  token1Name: string;

  @Prop({ required: true })
  token1Price: number;

  @Prop({ required: true })
  token1Symbol: string;

  @Prop({ required: true, default: new Date().getTime() })
  createdAt?: Date;

  @Prop()
  creation_block?: number;
}

export const PairSchema = SchemaFactory.createForClass(Pair);
