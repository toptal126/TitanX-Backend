import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  SwapLogsQuery,
  SwapLogsResult,
} from './interfaces/coinPrice.interface';
import { PairService } from './pair.service';
import { Pair } from './schemas/pair.schema';

@Controller('pairs')
export class PairController {
  constructor(private readonly service: PairService) {}

  @Get()
  async index(): Promise<Pair[]> {
    //top 1000
    return await this.service.findTop(1000);
  }

  @Get(':pairAddress')
  async find(@Param('pairAddress') pairAddress: string): Promise<Pair> {
    return await this.service.findOne(pairAddress);
  }

  @Get('/token/:tokenAddress')
  async findByTokenAddress(
    @Param('tokenAddress') tokenAddress: string,
  ): Promise<Pair[]> {
    this.service.findPairsFromDEX(tokenAddress);
    return await this.service.findByTokenAddress(tokenAddress);
  }

  @Get('/index/:pairIndex')
  async findByIndex(@Param('pairIndex') pairIndex: string): Promise<Pair> {
    return await this.service.findByIndex(pairIndex);
  }

  @Get('/search/:query')
  async search(@Param('query') query: string): Promise<Pair[]> {
    return await this.service.search(query);
  }
  @Get('/dex/:baseTokenAddress')
  async findPairsFromDEX(
    @Param('baseTokenAddress') baseTokenAddress: string,
  ): Promise<Pair[]> {
    return await this.service.findPairsFromDEX(baseTokenAddress);
  }

  @Get('/logs/swap/:pairAddress')
  async getLastSwapLogs(
    @Param('pairAddress') pairAddress: string,
    @Query() swapLogsQuery: SwapLogsQuery,
  ): Promise<SwapLogsResult> {
    if (!swapLogsQuery.queryCnt || swapLogsQuery.queryCnt > 100) {
      swapLogsQuery.queryCnt = 100;
    }
    if (!swapLogsQuery.toBlock) {
      swapLogsQuery.toBlock = 'latest';
    }
    // return swapLogsQuery;
    return await this.service.getLastSwapLogs(pairAddress, swapLogsQuery);
  }
}
