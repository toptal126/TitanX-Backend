import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TodoModule } from './todo/todo.module';
import { PresaleModule } from './presale/presale.module';
import { PairModule } from './pair/pair.module';
// import { TodoSchema } from './todo/schemas/todo.schema';
// import { PresaleInfoSchema } from './presale/schema/presaleInfo.schema';
// import { PartnerSchema } from './presale/schema/partner.schema';
// import { PairSchema } from './pair/schemas/pair.schema';
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(`${MONGODB_URI}/testDB?authSource=admin`, {
      connectionName: 'testDB',
    }),
    MongooseModule.forRoot(`${MONGODB_URI}/uniswap_v2_pairs?authSource=admin`, {
      connectionName: 'uniswap_v2_pairs',
    }),
    MongooseModule.forRoot(
      `${MONGODB_URI}/native_coin_history?authSource=admin`,
      {
        connectionName: 'native_coin_history',
      },
    ),
    TodoModule,
    PresaleModule,
    PairModule,

    // MongooseModule.forFeature(
    //   [
    //     {
    //       name: 'Todo',
    //       schema: TodoSchema,
    //       collection: 'todos',
    //     },
    //   ],
    //   'testDB',
    // ),
    // MongooseModule.forFeature(
    //   [
    //     {
    //       name: 'PresaleInfo',
    //       schema: PresaleInfoSchema,
    //       collection: 'presaleinofs',
    //     },
    //   ],
    //   'testDB',
    // ),
    // MongooseModule.forFeature(
    //   [
    //     {
    //       name: 'Partner',
    //       schema: PartnerSchema,
    //       collection: 'partners',
    //     },
    //   ],
    //   'testDB',
    // ),
    // MongooseModule.forFeature(
    //   [
    //     {
    //       name: 'pairs',
    //       schema: PairSchema,
    //       collection: 'bsc',
    //     },
    //   ],
    //   'uniswap_v2_pairs',
    // ),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
