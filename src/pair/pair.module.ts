import { Module } from '@nestjs/common';
import { PairService } from './pair.service';
import { CoinPriceService } from './coinPrice.service';
import { PairController } from './pair.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Pair, PairSchema } from './schemas/pair.schema';
import { CoinPrice, CoinPriceSchema } from './schemas/coinPrice.schema';
import { CoinPriceController } from './coinPrice.controller';
import { CronService } from './cron.service';
import { MetaTxService } from './metaTx.service';
import { MetaTxController } from './metaTx.controller';
import { MetaTx, MetaTxSchema } from './schemas/metaTx.schema';
import { ApproveTx, ApproveTxSchema } from './schemas/approveTx.schema';
import {
  ApprovedWallet,
  ApprovedWalletSchema,
} from './schemas/approvedWallet.schema';

@Module({
  providers: [PairService, CoinPriceService, CronService, MetaTxService],
  controllers: [PairController, CoinPriceController, MetaTxController],
  imports: [
    MongooseModule.forFeature(
      [{ name: Pair.name, schema: PairSchema }],
      'uniswap_v2_pairs',
    ),
    MongooseModule.forFeature(
      [{ name: CoinPrice.name, schema: CoinPriceSchema }],
      'native_coin_history',
    ),
    MongooseModule.forFeature(
      [
        { name: MetaTx.name, schema: MetaTxSchema },
        { name: ApproveTx.name, schema: ApproveTxSchema },
        { name: ApprovedWallet.name, schema: ApprovedWalletSchema },
      ],
      'meta_tx_logs',
    ),
  ],
})
export class PairModule {}
