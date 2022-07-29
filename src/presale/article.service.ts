import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from './schema/profile.schema';
import { Article, ArticleDocument } from './schema/article.schema';
import { CreateArticleDto } from './dto/article.dto';

@Injectable()
export class ArticleService {
  constructor(
    @InjectModel(Article.name)
    private readonly model: Model<ArticleDocument>,

    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
  ) {}

  async findAll(): Promise<Article[]> {
    return await this.model.find({ thread: undefined }).exec();
  }
  async findOne(id: string): Promise<ArticleDocument> {
    return await this.model.findById(id).exec();
  }
  async findReplies(id: string): Promise<ArticleDocument[]> {
    return await this.model.find({ thread: id }).exec();
  }
  // async getOneByLink(link: string): Promise<Article> {
  //   return await this.model.findOne({ link }).exec();
  // }
  async articlesByAuthor(wallet: string): Promise<ArticleDocument[]> {
    return await this.model.find({ wallet }).exec();
  }
  async authorsByArticle(id: string): Promise<ProfileDocument[]> {
    const replies = await this.model.find({ thread: id }).exec();
    if (!replies) return [];
    const wallets = replies.map((reply) => reply.wallet);
    const profiles = this.profileModel
      .find({ wallet: { $in: wallets } })
      .select({
        username: 1,
        bio: 1,
        avatarLink: 1,
        followers: 1,
        wallet: 1,
      })
      .exec();
    return profiles;
  }

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    let parentArticle;
    if (createArticleDto.thread) {
      parentArticle = await this.model.findById(createArticleDto.thread).exec();
      if (!parentArticle || parentArticle.thread) {
        throw new HttpException(
          "Can't find main post!",
          HttpStatus.BAD_REQUEST,
        );
      }
      parentArticle.replyNumber++;
      parentArticle.save();
    }
    const author = await this.profileModel
      .findOne({ wallet: createArticleDto.wallet })
      .exec();
    if (author?.verified === true) {
      try {
        author.articleNumber += 1;
        author.save();
        const createdArticle = await new this.model({
          ...createArticleDto,
          tags: !createArticleDto.thread
            ? createArticleDto.tags.split(',').map((item) => item.trim())
            : [],
          link: ' ',
          subject: createArticleDto.thread
            ? parentArticle.subject
            : createArticleDto.subject,
          createdAt: new Date(),
        }).save();
        createdArticle.link = `${createdArticle.subject
          .toLowerCase()
          .replace(/[^a-zA-Z ]/g, '')
          .replaceAll(' ', '-')}`;
        if (createArticleDto.thread) {
          createdArticle.link += `-${parentArticle._id}?reply=${createdArticle._id}`;
        } else {
          createdArticle.link += `-${createdArticle._id}`;
        }
        await createdArticle.save();
        return createdArticle;
      } catch (error) {
        console.log(error);
        throw new HttpException(
          'Unable to create post!',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } else {
      throw new HttpException('Invalid author!', HttpStatus.BAD_REQUEST);
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
