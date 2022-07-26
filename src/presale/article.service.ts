import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Partner, PartnerDocument } from './schema/partner.schema';
import { Article, ArticleDocument } from './schema/article.schema';
import { CreateArticleDto } from './dto/article.dto';

@Injectable()
export class ArticleService {
  constructor(
    @InjectModel(Article.name)
    private readonly model: Model<ArticleDocument>,

    @InjectModel(Partner.name)
    private readonly partner_model: Model<PartnerDocument>,
  ) {}

  async findAll(): Promise<Article[]> {
    return await this.model.find().exec();
  }
  async findOne(id: string): Promise<Article> {
    return await this.model.findById(id).exec();
  }
  async articlesByAuthor(author: string): Promise<Article[]> {
    return await this.model.find({ author }).exec();
  }

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    if (createArticleDto.thread) {
      const parentArticle = await this.model
        .findById(createArticleDto.thread)
        .exec();
      if (!parentArticle) {
        throw new HttpException(
          "Can't find main post!",
          HttpStatus.BAD_REQUEST,
        );
      }
      parentArticle.replyNumber++;
      parentArticle.save();
    }
    try {
      return await new this.model({
        ...createArticleDto,
        createdAt: new Date(),
      }).save();
    } catch (error) {
      throw new HttpException(
        'Unable to create Post!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async likeToggle(id: string, wallet: string): Promise<Article> {
    const article = await this.model.findById(id);
    if (!article) {
      throw new HttpException("Can't find the Post!", HttpStatus.BAD_REQUEST);
    }
    try {
      const indexOfWallet: number = article.likes.indexOf(wallet);
      if (indexOfWallet >= 0) article.likes.splice(indexOfWallet, 1);
      else article.likes.push(wallet);
      await article.save();
      return article;
    } catch (error) {
      throw new HttpException(
        'Unable to update the Post!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
