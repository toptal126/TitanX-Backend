import { Module } from '@nestjs/common';
import { PresaleInfoService } from './presale.service';
import { PresaleController } from './presale.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PresaleInfo, PresaleInfoSchema } from './schema/presaleInfo.schema';
import { Partner, PartnerSchema } from './schema/partner.schema';
import { Article, ArticleSchema } from './schema/article.schema';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';

@Module({
  providers: [PresaleInfoService, ArticleService],
  controllers: [PresaleController, ArticleController],
  imports: [
    MongooseModule.forFeature(
      [
        { name: PresaleInfo.name, schema: PresaleInfoSchema },
        { name: Partner.name, schema: PartnerSchema },
        { name: Article.name, schema: ArticleSchema },
      ],
      'testDB',
    ),
  ],
})
export class PresaleModule {}
