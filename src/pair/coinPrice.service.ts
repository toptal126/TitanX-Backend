import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import {
  LOG_TOPIC_SWAP,
  WBNB_ADDRESS,
  WBNB_BUSD_PAIR,
} from 'src/helpers/constants';
import {
  BitQueryTradeInterval,
  CoinPriceCandle,
  CoinPriceQuery,
} from './interfaces/coinPrice.interface';
import { DEX_TRADE_PER_INTERVAL } from './query/bitquery.query';
import { CoinPrice, CoinPriceDocument } from './schemas/coinPrice.schema';
import axios from 'axios';
require('dotenv').config();

const CURRENT_API_KEY_ARRAY = process.env.BITQUERY_API_KEY_ARRAY.split(' ');

@Injectable()
export class CoinPriceService {
  private Web3;
  private readonly logger = new Logger(CoinPriceService.name);

  constructor(
    @InjectModel(CoinPrice.name)
    private readonly model: Model<CoinPriceDocument>,
  ) {
    this.Web3 = require('web3');
  }

  private getWeb3(): any {
    return new this.Web3('https://bsc-dataseed.binance.org/');
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
        this.getWeb3().eth.getBlockNumber(),
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
        blockNumberArray.length,
        timeStampArray.length,
        //   block2timeStamp,
      );

      const logs = await this.getWeb3().eth.getPastLogs({
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

          this.logger.debug(updateDBItem);

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
    const block = await this.getWeb3().eth.getBlock(blockNumber);
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
      let queryTimeStamp: number =
        new Date(dexTrades[currentIndex].timeInterval.minute).getTime() / 1000;
      candleArr[i].open = dexTrades[currentIndex].open;
      candleArr[i].close = dexTrades[currentIndex].close;
      candleArr[i].high = dexTrades[currentIndex].high;
      candleArr[i].low = dexTrades[currentIndex].low;
      candleArr[i].volume = 0;
      candleArr[i].time = nativeCoinPriceArry[i].timeStamp;
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
}
