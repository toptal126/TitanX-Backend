import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { LOG_TOPIC_SWAP, WBNB_BUSD_PAIR } from 'src/helpers/constants';
import { CoinPrice, CoinPriceDocument } from './schemas/coinPrice.schema';
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

  @Cron('5 * * * * *')
  async handleCron() {
    this.logger.debug(
      `Called when the current second is 15 - ${new Date().getTime() / 1000}`,
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

    console.log(
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
        console.log(updateDBItem);

        this.model
          .findOneAndUpdate({ timeStamp: processingTimeStamp }, updateDBItem, {
            upsert: true,
          })
          .exec();
      }
    });
  }

  async getBlockTimeStampByNumber(blockNumber: number) {
    const block = await this.getWeb3().eth.getBlock(blockNumber);
    return block.timestamp;
  }
}
