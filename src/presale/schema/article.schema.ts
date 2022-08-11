import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Document, Types } from 'mongoose';

export type ArticleDocument = Article & Document;

@Schema()
export class Article {
  @Prop({ required: true })
  wallet: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: Article.name, default: null })
  thread: Types.ObjectId;

  @Prop()
  subject: string;

  @Prop()
  link: string;

  @Prop()
  markdown: string;

  @Prop({ default: '' })
  giphyLink: string;

  @Prop()
  type: string;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ default: 0 })
  replyNumber: number;

  @Prop({ default: [] })
  likes: Array<string>;

  @Prop({ default: [] })
  tags: Array<string>;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true, default: false })
  isDraft: boolean;

  @Prop()
  deletedAt?: Date;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
