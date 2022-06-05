import { Controller, Get, Param } from '@nestjs/common';
import { CoinPriceService } from './coinPrice.service';
import { CoinPrice } from './schemas/coinPrice.schema';

@Controller('coinprice')
export class CoinPriceController {
  constructor(private readonly service: CoinPriceService) {}

  @Get()
  async index() {
    return 'this.service.';
  }

  @Get('latest')
  async getLatest() {
    return this.service.findLatest();
  }
}
