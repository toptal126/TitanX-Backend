import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import {
  BUSD_ADDRESS,
  DEAD_ADDRESS,
  LOG_TOPIC_SWAP,
  WBNB_ADDRESS,
  WBNB_BUSD_PAIR,
  ZERO_ADDRESS,
} from 'src/helpers/constants';
import * as ABI_ERC20 from 'src/helpers/abis/ABI_ERC20.json';
import {
  BitQueryTradeInterval,
  CoinPriceCandle,
  CoinPriceQuery,
  TokenInformation,
} from './interfaces/coinPrice.interface';
import {
  CONTRACT_CREATION_BLOCK,
  DEX_TRADE_PER_INTERVAL,
} from './query/bitquery.query';
import { CoinPrice, CoinPriceDocument } from './schemas/coinPrice.schema';
import axios from 'axios';
import { Pair } from './schemas/pair.schema';
require('dotenv').config();

const CURRENT_API_KEY_ARRAY = process.env.BITQUERY_API_KEY_ARRAY.split(' ');

@Injectable()
export class CoinPriceService {
  private web3;
  private readonly logger = new Logger(CoinPriceService.name);

  constructor(
    @InjectModel(CoinPrice.name)
    private readonly model: Model<CoinPriceDocument>,
  ) {
    const Web3 = require('web3');
    this.web3 = new Web3('https://bsc-dataseed.binance.org/');
  }

  public async removeDoubledPairs() {
    const doubledPairs = await this.model
      .aggregate([
        {
          $group: {
            _id: { timeStamp: '$timeStamp' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $match: { count: { $gt: 1 } } },
      ])
      .limit(100)
      .exec();
    doubledPairs.forEach((item) => {
      this.model.findOneAndDelete({ timeStamp: item._id.timeStamp }).exec();
    });
    return doubledPairs;
  }

  private getERC20Contract(tokenAddress: string) {
    return new this.web3.eth.Contract(ABI_ERC20, tokenAddress);
  }

  async findLatest(): Promise<CoinPrice> {
    const latest = await this.model
      .find()
      .sort({ timeStamp: -1 })
      .limit(1)
      .exec();
    return latest[0];
  }

  async findByBlockNumber(blockNumber): Promise<CoinPrice> {
    const coinPrices = await this.model
      .find({ toBlock: { $gte: blockNumber } })
      .sort({ timeStamp: 1 })
      .limit(1)
      .exec();
    return coinPrices[0];
  }
  async findByTimeStamp(timeStamp): Promise<CoinPrice> {
    const coinPrices = await this.model
      .find({ timeStamp: { $gte: timeStamp } })
      .sort({ timeStamp: 1 })
      .limit(1)
      .exec();
    return coinPrices[0];
  }

  @Cron('5 * * * * *')
  async handleCron() {
    try {
      this.logger.debug(
        `Called when the current second is 5 - ${new Date().getTime() / 1000}`,
      );
      const [[latestDBItem], blockNumber] = await Promise.all([
        this.model.find().sort({ timeStamp: -1 }).limit(1).exec(),
        this.web3.eth.getBlockNumber(),
      ]);

      const blockNumberArray: number[] = Array.from(
        { length: blockNumber - latestDBItem.toBlock },
        (_, offset) => offset + latestDBItem.toBlock + 1,
      );

      const timeStampArray = await Promise.all(
        blockNumberArray.map((blockNumber) =>
          this.getBlockTimeStampByNumber(blockNumber),
        ),
      );

      let block2timeStamp = [];
      blockNumberArray.forEach((item, index) => {
        block2timeStamp[`_${item}`] = timeStampArray[index];
      });

      this.logger.debug(
        `${blockNumberArray.length}, ${timeStampArray.length}, ${block2timeStamp}`,
      );

      const logs = await this.web3.eth.getPastLogs({
        address: WBNB_BUSD_PAIR,
        fromBlock: latestDBItem.toBlock,
        toBlock: blockNumber,
        topics: [LOG_TOPIC_SWAP],
      });

      let processingTimeStamp = latestDBItem.timeStamp;
      let fromBlock = latestDBItem.toBlock;
      logs.forEach((item) => {
        const logTimeStamp = block2timeStamp[`_${item.blockNumber}`];
        if (logTimeStamp > processingTimeStamp) {
          const amount0In = parseInt('0x' + item.data.slice(2, 66));
          const amount0Out = parseInt('0x' + item.data.slice(130, 194));
          const amount1In = parseInt('0x' + item.data.slice(66, 130));
          const amount1Out = parseInt('0x' + item.data.slice(194));
          const usdPrice = (amount1In + amount1Out) / (amount0In + amount0Out);
          if (usdPrice === 0 || usdPrice === Infinity || usdPrice === null)
            return;

          processingTimeStamp += 60;

          const updateDBItem = {
            timeStamp: processingTimeStamp,
            usdPrice,
            fromBlock,
            toBlock: item.blockNumber,
            updatedAt: new Date().getTime(),
          };
          fromBlock = item.blockNumber;

          // this.logger.debug(updateDBItem);

          this.model
            .findOneAndUpdate(
              { timeStamp: processingTimeStamp },
              updateDBItem,
              {
                upsert: true,
              },
            )
            .exec();
        }
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getBlockTimeStampByNumber(blockNumber: number) {
    const block = await this.web3.eth.getBlock(blockNumber);
    return block.timestamp;
  }

  async getDexTradeDuringPeriodPerInterval(
    candleQuery: CoinPriceQuery,
  ): Promise<CoinPriceCandle[]> {
    let candleArr: CoinPriceCandle[] = [];
    let bitqueryArr;
    let nativeCoinPriceArry: CoinPrice[] = [];
    let desiredLength: number;
    const isBNBPaired: boolean =
      candleQuery.baseAddress.toLocaleLowerCase() ===
        WBNB_ADDRESS.toLocaleLowerCase() ||
      candleQuery.quoteAddress.toLocaleLowerCase() ===
        WBNB_ADDRESS.toLocaleLowerCase();
    if (isBNBPaired)
      [{ result: nativeCoinPriceArry, desiredLength }, bitqueryArr] =
        await Promise.all([
          this.getNativeCoinPriceByInterval(
            candleQuery.from,
            candleQuery.to,
            candleQuery.interval,
          ),
          this.executeBitqueryAPI(DEX_TRADE_PER_INTERVAL(candleQuery)),
        ]);
    else
      bitqueryArr = await this.executeBitqueryAPI(
        DEX_TRADE_PER_INTERVAL(candleQuery),
      );

    // console.log(
    //   candleQuery,
    //   isBNBPaired,
    //   nativeCoinPriceArry.length,
    //   desiredLength,
    // );

    // console.log(DEX_TRADE_PER_INTERVAL(candleQuery));

    let dexTrades: BitQueryTradeInterval[] =
      bitqueryArr.data.ethereum.dexTrades;
    dexTrades = dexTrades.filter((item) => {
      let timeStamp: number =
        new Date(item.timeInterval.minute).getTime() / 1000;
      return (
        timeStamp >= nativeCoinPriceArry[0].timeStamp &&
        timeStamp <= nativeCoinPriceArry.at(-1).timeStamp
      );
    });
    // dexTrades.forEach((item) => {
    //   console.log(
    //     item.timeInterval.minute,
    //     new Date(item.timeInterval.minute).getTime() / 1000,
    //     new Date().getTime() / 1000 -
    //       new Date(item.timeInterval.minute).getTime() / 1000,
    //     item.open,
    //     item.close,
    //     item.volume,
    //   );
    // });

    for (let i = 0; i < desiredLength; i++) {
      candleArr.push({
        open: 0,
        close: 0,
        high: 0,
        low: 0,
        volume: 0,
        time: 0,
      });
    }

    let currentIndex: number = 0;
    for (let i = 0; i < desiredLength; i++) {
      if (dexTrades[currentIndex] === undefined) {
        dexTrades[currentIndex] = {
          timeInterval: {
            minute: new Date().toISOString(),
          },
          open: -1 / nativeCoinPriceArry[i].usdPrice,
          close: -1 / nativeCoinPriceArry[i].usdPrice,
          high: -1 / nativeCoinPriceArry[i].usdPrice,
          low: -1 / nativeCoinPriceArry[i].usdPrice,
          volume: 0,
        };
      }
      let queryTimeStamp: number =
        new Date(dexTrades[currentIndex].timeInterval.minute).getTime() / 1000;
      candleArr[i].open = dexTrades[currentIndex].open;
      candleArr[i].close = dexTrades[currentIndex].close;
      candleArr[i].high = dexTrades[currentIndex].high;
      candleArr[i].low = dexTrades[currentIndex].low;
      candleArr[i].volume = 0;
      candleArr[i].time = nativeCoinPriceArry[i].timeStamp * 1000;
      if (nativeCoinPriceArry[i].timeStamp === queryTimeStamp) {
        candleArr[i].volume = dexTrades[currentIndex].volume;
        if (dexTrades[currentIndex + 1]) currentIndex++;
      } else if (nativeCoinPriceArry[i].timeStamp < queryTimeStamp) {
        candleArr[i].close = dexTrades[currentIndex].open;
      } else {
        candleArr[i].open = dexTrades[currentIndex].close;
      }

      candleArr[i].close *= nativeCoinPriceArry[i].usdPrice;
      candleArr[i].open *= nativeCoinPriceArry[i].usdPrice;
      candleArr[i].high *= nativeCoinPriceArry[i].usdPrice;
      candleArr[i].low *= nativeCoinPriceArry[i].usdPrice;
      candleArr[i].volume *= nativeCoinPriceArry[i].usdPrice;
    }
    candleArr.forEach((item, i) => {
      if (candleArr.length - 1 !== i) {
        item.close = candleArr[i + 1].open;
      }

      if (item.volume === 0) {
        item.high = item.close > item.open ? item.close : item.open;
        item.low = item.close < item.open ? item.close : item.open;
      }
      // console.log(item);
    });
    // console.log(dexTrades.length, candleArr.length);
    return candleArr;
  }

  async executeBitqueryAPI(request: any) {
    const BITQUERY_API_KEY = CURRENT_API_KEY_ARRAY.at(
      parseInt((Math.random() * CURRENT_API_KEY_ARRAY.length).toString()),
    );
    try {
      const { data } = await axios.post(
        'https://graphql.bitquery.io/',
        { ...request },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': BITQUERY_API_KEY,
          },
        },
      );
      return data;
    } catch (error) {
      // console.log(
      //   `bitquery graphql error at ${
      //     new Date().getTime() / 1000
      //   }, ${BITQUERY_API_KEY}`,
      //   error,
      // );
      console.log(error);
      // throw error;
      return [];
    }
  }

  async getNativeCoinPriceByInterval(
    _from: any, // second
    to: number, // second
    intervalMin: number, // minute
  ): Promise<{ result: CoinPrice[]; desiredLength: number }> {
    let intervalSec: number = intervalMin * 60;
    let from: number = parseInt(_from);
    let _temp: number = (intervalSec - (from % intervalSec)) % intervalSec;
    const stTimeStamp: number = from + _temp;

    const edTimeStamp: number = to - (to % intervalSec);
    const desiredLength: number = (edTimeStamp - stTimeStamp) / intervalSec + 1;
    // console.log(desiredLength, 'desiredLength', edTimeStamp);
    let result: CoinPrice[] = [];
    for (let i = 0; i < desiredLength; i++) {
      result.push(new CoinPrice());
    }

    const dbResult = await this.model
      .find({
        timeStamp: { $gte: from, $lte: to, $mod: [intervalSec, 0] },
      })
      .exec();
    // console.log(dbResult.length, desiredLength);
    if (dbResult.length === 0) return { result: [], desiredLength: 0 };

    let currentIndex: number = 0;
    let currentTimeStamp = stTimeStamp;
    for (let i = 0; i < desiredLength; i++) {
      if (currentTimeStamp === dbResult[currentIndex].timeStamp) {
        result[i] = new CoinPrice(dbResult[currentIndex]);
        if (dbResult[currentIndex + 1] !== undefined) currentIndex++;
        currentTimeStamp += intervalSec;
        continue;
      } else {
        result[i] = new CoinPrice(dbResult[currentIndex]);
        result[i].timeStamp = currentTimeStamp;
        currentTimeStamp += intervalSec;
      }
    }
    // for (let i = 0; i < desiredLength; i++) {
    //   console.log(i, result[i].usdPrice, dbResult[i]?.usdPrice);
    // }
    return { result, desiredLength };
  }

  async getTokenInformation(
    tokenAddress: string,
    bestPair: Pair,
  ): Promise<TokenInformation> {
    const st = new Date().getTime();

    const tokenContract = this.getERC20Contract(tokenAddress);
    const [{ data: PCS_API_RESULT }, minted, decimals, dead_amount] =
      await Promise.all([
        axios.get(`https://api.pancakeswap.info/api/v2/tokens/${tokenAddress}`),
        tokenContract.methods.totalSupply().call(),
        tokenContract.methods.decimals().call(),
        tokenContract.methods.balanceOf(DEAD_ADDRESS).call(),
      ]);
    let isToken1BNB: boolean = true;
    let isToken1BUSD: boolean = false;
    let isBUSDPaired: boolean = false;
    if (bestPair.token1.toLocaleLowerCase() === WBNB_ADDRESS.toLowerCase())
      isToken1BNB = true;
    else if (bestPair.token0.toLocaleLowerCase() === WBNB_ADDRESS.toLowerCase())
      isToken1BNB = false;
    else if (
      bestPair.token1.toLocaleLowerCase() === BUSD_ADDRESS.toLowerCase()
    ) {
      isBUSDPaired = true;
      isToken1BUSD = true;
    } else if (
      bestPair.token0.toLocaleLowerCase() === BUSD_ADDRESS.toLowerCase()
    ) {
      isBUSDPaired = true;
      isToken1BUSD = false;
    }
    let result: TokenInformation = {
      id: tokenAddress,
      price: parseFloat(PCS_API_RESULT.data?.price),
      symbol: PCS_API_RESULT.data?.symbol,
      name: PCS_API_RESULT.data?.name,
      minted: parseInt(minted) / 10 ** decimals,
      burned: parseInt(dead_amount) / 10 ** decimals,
      decimals: parseInt(decimals),
      pair: bestPair.pairAddress,
      isToken1BNB,
      isToken1BUSD,
      isBUSDPaired,
    };
    console.log(`took: ${new Date().getTime() - st} ms`);
    return result;
  }

  async getCreationBlock(contractAddress: string) {
    const creationBlock = await this.executeBitqueryAPI(
      CONTRACT_CREATION_BLOCK(contractAddress),
    );
    return creationBlock.data.ethereum.smartContractCalls[0].block;
  }
}
