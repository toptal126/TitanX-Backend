import { Module } from '@nestjs/common';
import { PairService } from './pair.service';
import { PairController } from './pair.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Pair, PairSchema } from './schemas/pair.schema';

@Module({
  providers: [PairService],
  controllers: [PairController],
  imports: [
    MongooseModule.forFeature(
      [{ name: Pair.name, schema: PairSchema }],
      'uniswap_v2_pairs',
    ),
  ],
})
export class PairModule {}
