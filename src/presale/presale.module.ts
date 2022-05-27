import { Module } from '@nestjs/common';
import { PresaleInfoService } from './presale.service';
import { PresaleController } from './presale.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PresaleInfo, PresaleInfoSchema } from './schema/presaleInfo.schema';
import { Partner, PartnerSchema } from './schema/partner.schema';

@Module({
  providers: [PresaleInfoService],
  controllers: [PresaleController],
  imports: [
    MongooseModule.forFeature(
      [
        { name: PresaleInfo.name, schema: PresaleInfoSchema },
        { name: Partner.name, schema: PartnerSchema },
      ],
      'testDB',
    ),
  ],
})
export class PresaleModule {}
