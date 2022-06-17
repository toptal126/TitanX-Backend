import { Module } from '@nestjs/common';
import { PairService } from './pair.service';
import { CoinPriceService } from './coinPrice.service';
import { PairController } from './pair.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Pair, PairSchema } from './schemas/pair.schema';
import { CoinPrice, CoinPriceSchema } from './schemas/coinPrice.schema';
import { CoinPriceController } from './coinPrice.controller';
import { CronService } from './cron.service';

@Module({
  providers: [PairService, CoinPriceService, CronService],
  controllers: [PairController, CoinPriceController],
  imports: [
    MongooseModule.forFeature(
      [{ name: Pair.name, schema: PairSchema }],
      'uniswap_v2_pairs',
    ),
    MongooseModule.forFeature(
      [{ name: CoinPrice.name, schema: CoinPriceSchema }],
      'native_coin_history',
    ),
  ],
})
export class PairModule {}
