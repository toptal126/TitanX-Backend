import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PresaleInfoDocument = PresaleInfo & Document;

@Schema()
export class PresaleInfo {
  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  owner: string;

  @Prop()
  external_links?: Array<{
    name: string;
    link: string;
  }>;

  @Prop()
  description?: string;

  @Prop()
  update?: string;

  @Prop()
  completedAt?: Date;

  @Prop({ required: true })
  createdAt: Date;

  @Prop()
  deletedAt?: Date;
}

export const PresaleInfoSchema = SchemaFactory.createForClass(PresaleInfo);
