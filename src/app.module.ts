import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TodoModule } from './todo/todo.module';
import { PresaleModule } from './presale/presale.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://kuinka:5a0eYeBNtTKH29OL@cluster0.9kyrn.mongodb.net/testDB',
    ),
    TodoModule,
    PresaleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
