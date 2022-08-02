import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/article.dto';
import { ProfileService } from './profile.service';

@Controller('articles')
export class ArticleController {
  constructor(
    private readonly service: ArticleService,
    private readonly profileSerivce: ProfileService,
  ) {}

  @Get()
  async index() {
    return await this.service.findAll();
  }

  // @Get(':id')
  // async getOneById(@Param('id') id: string) {
  //   return await this.service.findOne(id);
  // }

  @Get(':link')
  async getOneByLink(@Param('link') link: string) {
    const article = await this.service.findOne(link.split('-').at(-1));
    if (!article) return {};
    const [replies, author] = await Promise.all([
      this.service.findReplies(article._id),
      this.profileSerivce.findAuthorByWallet(article.wallet),
    ]);
    return { post: article, replies, author };
  }

  @Get('u/:wallet')
  async articlesByAuthor(@Param('wallet') wallet: string) {
    return await this.service.articlesByAuthor(wallet);
  }
  @Get('authors/:id')
  async authorsByArticle(@Param('id') id: string) {
    return await this.service.authorsByArticle(id);
  }

  @Post()
  async create(@Body() createArticleDto: CreateArticleDto) {
    return await this.service.create(createArticleDto);
  }

  @Post('like/:id/:wallet')
  async like(@Param('id') id: string, @Param('wallet') wallet: string) {
    return await this.service.likeToggle(id, wallet);
  }
}
