import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { WBNB_ADDRESS } from 'src/helpers/constants';
import { CoinPriceService } from './coinPrice.service';
import {
  CoinPriceCandle,
  CoinPriceQuery,
  TokenInformation,
} from './interfaces/coinPrice.interface';
import { PairService } from './pair.service';
import { Pair } from './schemas/pair.schema';

@Controller('coinprice')
export class CoinPriceController {
  constructor(
    private readonly service: CoinPriceService,
    private readonly pairService: PairService,
  ) {}

  @Get()
  async index() {
    return await this.service.removeDoubledPairs();
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
    try {
      const st = new Date().getTime() / 1000;
      candleQuery.to = parseInt(candleQuery.to.toString());
      candleQuery.from = parseInt(candleQuery.from.toString());
      candleQuery.interval = parseInt(candleQuery.interval.toString());

      const bestPair = await this.pairService.findBestPair(tokenAddress);
      // console.log(bestPair);
      if (bestPair === undefined) {
        throw new HttpException(
          'Invalid Token Address',
          HttpStatus.BAD_REQUEST,
        );
      }
      candleQuery.from -= candleQuery.interval * 60;
      candleQuery.to += candleQuery.interval * 60;
      candleQuery.baseAddress =
        bestPair.token0 !== WBNB_ADDRESS ? bestPair.token0 : bestPair.token1;
      candleQuery.quoteAddress =
        bestPair.token0 === WBNB_ADDRESS ? bestPair.token0 : bestPair.token1;
      // console.log(candleQuery);

      let result: CoinPriceCandle[] =
        await this.service.getDexTradeDuringPeriodPerInterval(
          candleQuery,
          tokenAddress,
        );

      console.log(
        new Date().getTime() / 1000 - st,
        candleQuery.from,
        candleQuery.to,
        candleQuery.interval,
      );
      // return result;
      return result.slice(1, -1);
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  @Get('/information/:tokenAddress')
  async tokenInformation(
    @Param('tokenAddress') tokenAddress: string,
  ): Promise<TokenInformation> {
    try {
      const bestPair: Pair = await this.pairService.findBestPair(tokenAddress);
      return await this.service.getTokenInformation(tokenAddress, bestPair);
    } catch (error) {
      console.log(error);
      throw new HttpException('Invalid Token Address', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('/creationBlockNumber/:contractAddress')
  async creationBlockNumber(@Param('contractAddress') contractAddress: string) {
    try {
      return await this.service.getCreationBlock(contractAddress);
    } catch (error) {
      // console.log(error);
      throw new HttpException(
        'Invalid Contract Address',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
