import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApproveTxDocument = ApproveTx & Document;

@Schema({ collection: 'approved-tx' })
export class ApproveTx {
  @Prop({ required: true })
  rpcUrl: string;

  @Prop({ required: true, type: Object })
  fields: any;
  @Prop({ required: true, type: Object })
  txInfo: any;
  @Prop({ required: true, type: Object })
  result: any;
  @Prop({ required: true, type: Object })
  createdAt: Date;
}

export const ApproveTxSchema = SchemaFactory.createForClass(ApproveTx);
