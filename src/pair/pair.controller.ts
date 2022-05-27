import { Controller, Get, Param } from '@nestjs/common';
import { PairService } from './pair.service';

@Controller('pairs')
export class PairController {
  constructor(private readonly service: PairService) {}

  @Get()
  async index() {
    //top 1000
    return await this.service.findTop(1000);
  }

  @Get(':pairAddress')
  async find(@Param('pairAddress') pairAddress: string) {
    return await this.service.findOne(pairAddress);
  }

  @Get('/index/:pairIndex')
  async findByIndex(@Param('pairIndex') pairIndex: string) {
    return await this.service.findByIndex(pairIndex);
  }

  @Get('/search/:querry')
  async search(@Param('querry') querry: string) {
    return await this.service.search(querry);
  }
}
