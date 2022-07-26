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

@Controller('articles')
export class ArticleController {
  constructor(private readonly service: ArticleService) {}

  @Get()
  async index() {
    return await this.service.findAll();
  }

  @Get(':id')
  async getOneById(@Param('id') id: string) {
    return await this.service.findOne(id);
  }

  @Get('author/:author')
  async articlesByAuthor(@Param('author') author: string) {
    return await this.service.articlesByAuthor(author);
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
