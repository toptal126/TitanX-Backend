import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Document, Types } from 'mongoose';

export type ArticleDocument = Article & Document;

@Schema()
export class Article {
  @Prop({ required: true })
  wallet: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: Article.name, default: null })
  thread: Types.ObjectId;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  markdown: string;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ default: 0 })
  replyNumber: number;

  @Prop({ default: [] })
  likes: Array<string>;

  @Prop({ default: ' ' })
  tags: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop()
  deletedAt?: Date;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
