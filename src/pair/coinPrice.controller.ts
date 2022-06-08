import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { CoinPriceService } from './coinPrice.service';
import {
  CoinPriceCandle,
  CoinPriceQuery,
} from './interfaces/coinPrice.interface';
import { PairService } from './pair.service';

@Controller('coinprice')
export class CoinPriceController {
  constructor(
    private readonly service: CoinPriceService,
    private readonly pairService: PairService,
  ) {}

  @Get()
  async index() {
    return 'this.service.';
  }

  @Get('latest')
  async getLatest() {
    return this.service.findLatest();
  }

  @Get('block/:blockNumber')
  async findByBlockNumber(@Param('blockNumber') blockNumber: number) {
    return await this.service.findByBlockNumber(blockNumber);
  }

  @Get('timestamp/:timeStamp')
  async findByTimeStamp(@Param('timeStamp') timeStamp: number) {
    return await this.service.findByTimeStamp(timeStamp);
  }

  @Get('candle/:tokenAddress')
  async getCandleDuringPeriod(
    @Param('tokenAddress') tokenAddress: string,
    @Query() candleQuery: CoinPriceQuery,
  ): Promise<CoinPriceCandle[]> {
    const st = new Date().getTime() / 1000;
    candleQuery.to = parseInt(candleQuery.to.toString());
    candleQuery.from = parseInt(candleQuery.from.toString());
    candleQuery.interval = parseInt(candleQuery.interval.toString());

    const bestPair = await this.pairService.findBestPair(tokenAddress);
    // console.log(bestPair);
    if (bestPair === undefined) {
      throw new HttpException('Invalid Token Address', HttpStatus.BAD_REQUEST);
    }
    candleQuery.from -= candleQuery.interval * 60;
    candleQuery.to += candleQuery.interval * 60;
    candleQuery.baseAddress = bestPair.token1;
    candleQuery.quoteAddress = bestPair.token0;
    console.log(candleQuery);

    let result: CoinPriceCandle[] =
      await this.service.getDexTradeDuringPeriodPerInterval(candleQuery);

    console.log(new Date().getTime() / 1000 - st);
    // return result;
    return result.slice(1, -1);
  }
}
