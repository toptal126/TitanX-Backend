import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TodoModule } from './todo/todo.module';
import { PresaleModule } from './presale/presale.module';
import { PairModule } from './pair/pair.module';
// import { TodoSchema } from './todo/schemas/todo.schema';
// import { PresaleInfoSchema } from './presale/schema/presaleInfo.schema';
// import { PartnerSchema } from './presale/schema/partner.schema';
// import { PairSchema } from './pair/schemas/pair.schema';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://kuinka:5a0eYeBNtTKH29OL@cluster0.9kyrn.mongodb.net/testDB',
      { connectionName: 'testDB' },
    ),
    MongooseModule.forRoot(
      'mongodb+srv://kuinka:5a0eYeBNtTKH29OL@cluster0.9kyrn.mongodb.net/uniswap_v2_pairs',
      { connectionName: 'uniswap_v2_pairs' },
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
