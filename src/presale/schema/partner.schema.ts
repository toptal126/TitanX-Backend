import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PartnerDocument = Partner & Document;

@Schema()
export class Partner {
  @Prop()
  address: string;

  @Prop()
  logo_link: string;

  @Prop()
  external_link?: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop()
  deletedAt?: Date;
}

export const PartnerSchema = SchemaFactory.createForClass(Partner);
