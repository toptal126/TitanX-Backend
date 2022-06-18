import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import {
  BIG_TOKEN_ADDRESSES,
  DEX_FACTORIES_ADDRESS,
  getRandRpcElseOne,
  LOG_TOPIC_SWAP,
  PANCAKESWAP_V2_FACTORY,
  WBNB_ADDRESS,
  WBNB_BUSD_PAIR,
} from 'src/helpers/constants';
import * as ABI_ERC20 from 'src/helpers/abis/ABI_ERC20.json';
import * as ABI_UNISWAP_V2_FACTORY from 'src/helpers/abis/ABI_UNISWAP_V2_FACTORY.json';
import * as ABI_UNISWAP_V2_PAIR from 'src/helpers/abis/ABI_UNISWAP_V2_PAIR.json';

import { CoinPrice, CoinPriceDocument } from './schemas/coinPrice.schema';
import axios from 'axios';
import { Pair, PairDocument } from './schemas/pair.schema';
require('dotenv').config();

@Injectable()
export class CronService {
  private web3;
  private rpcUrl;
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectModel(CoinPrice.name)
    private readonly model: Model<CoinPriceDocument>,
    @InjectModel(Pair.name)
    private readonly pairModel: Model<PairDocument>,
  ) {
    const Web3 = require('web3');
    this.rpcUrl = getRandRpcElseOne('');
    this.web3 = new Web3(this.rpcUrl);
  }

  changeWeb3RpcUrl = () => {
    this.rpcUrl = getRandRpcElseOne(this.rpcUrl);
    const Web3 = require('web3');
    this.web3 = new Web3(this.rpcUrl);
  };

  getV2PairContract(pairAddress) {
    return new this.web3.eth.Contract(ABI_UNISWAP_V2_PAIR, pairAddress);
  }

  getERC20Contract(address) {
    return new this.web3.eth.Contract(ABI_ERC20, address);
  }

  async getBlockTimeStampByNumber(blockNumber: number) {
    const block = await this.web3.eth.getBlock(blockNumber);
    return block.timestamp;
  }

  // BNB Price Update
  @Cron('5 * * * * *')
  async updateCoinPrice() {
    let i = 0;
    while (i < 5) {
      try {
        this.logger.debug(
          `Called when the current second is 5 - ${
            new Date().getTime() / 1000
          }`,
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
            const usdPrice =
              (amount1In + amount1Out) / (amount0In + amount0Out);
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
        return;
      } catch (error) {
        this.logger.error(error);
        this.changeWeb3RpcUrl();
        i++;
      }
    }
  }

  // refetch latest 10000 pairs every hour at 0:30s
  @Cron('30 0 * * * *')
  async fetchLast10000() {
    console.log('every 30 minute');

    let batchCount = 100;

    const factoryContract = new this.web3.eth.Contract(
      ABI_UNISWAP_V2_FACTORY,
      PANCAKESWAP_V2_FACTORY,
    );
    let [loggedLastPair] = await Promise.all([
      this.pairModel.findOne().sort({ pairIndex: -1 }).limit(1).exec(),
    ]);

    let lastPair = loggedLastPair.pairIndex;
    let startPair = lastPair - 10000;
    // lastPair = startPair + 1;
    for (let i = startPair - batchCount; i < lastPair; i += batchCount) {
      let idArr = Array.from(
        { length: batchCount },
        (_, offset) => i + offset,
      ).filter((item) => item < lastPair);

      // const pairInfoArr =
      await Promise.all(
        idArr.map((pairIndex) =>
          this.getPairInfobyIndex(pairIndex, factoryContract),
        ),
      );
      // console.log(pairInfoArr);
    }

    return lastPair;
  }

  // refetch pairs which is larget than 10k every hour at 30:30s
  @Cron('30 30 * * * *')
  // @Cron('*/5 * * * * *')
  async fetchTopPairs() {
    console.log('fetchTopPairs');
    let cap = 10000;
    let batchCount = 100;

    const factoryContract = new this.web3.eth.Contract(
      ABI_UNISWAP_V2_FACTORY,
      PANCAKESWAP_V2_FACTORY,
    );

    let topPairIndex = await this.pairModel
      .find({ reserve_usd: { $gt: cap } })
      .sort({ reserve_usd: -1 })
      .exec();

    for (let i = 0; i < topPairIndex.length; i += batchCount) {
      let idArr = Array.from(
        { length: batchCount },
        (_, offset) => topPairIndex.at(i + offset)?.pairIndex,
      ).filter((item) => item !== undefined);

      await Promise.all(
        idArr.map((pairIndex) =>
          this.getPairInfobyIndex(pairIndex, factoryContract),
        ),
      );
      console.log(`updating top processing ${batchCount} from ${i} done!`);
    }
  }

  // refetch new pairs every 5 minutes
  @Cron('0 */5 * * * *')
  async fetchNewPairs() {
    console.log('every 5 minute');
    axios.get('https://data.titanx.org/coinprice');

    let batchCount = 5;

    const factoryContract = new this.web3.eth.Contract(
      ABI_UNISWAP_V2_FACTORY,
      PANCAKESWAP_V2_FACTORY,
    );
    let [lastPair, loggedLastPair] = await Promise.all([
      factoryContract.methods.allPairsLength().call(),
      this.pairModel.findOne().sort({ pairIndex: -1 }).limit(1).exec(),
    ]);

    let startPair = loggedLastPair.pairIndex + 1;
    // lastPair = startPair + 1;
    console.log(startPair, lastPair);

    for (let i = startPair - batchCount; i < lastPair; i += batchCount) {
      let idArr = Array.from(
        { length: batchCount },
        (_, offset) => i + offset,
      ).filter((item) => item < lastPair);

      // const pairInfoArr =
      await Promise.all(
        idArr.map((pairIndex) =>
          this.getPairInfobyIndex(pairIndex, factoryContract),
        ),
      );
      // console.log(pairInfoArr);
    }

    return lastPair;
  }

  //990878
  @Cron('*/5 * * * * *')
  testFunction() {
    const factoryContract = new this.web3.eth.Contract(
      ABI_UNISWAP_V2_FACTORY,
      PANCAKESWAP_V2_FACTORY,
    );
    // this.getPairInfobyIndex(111, factoryContract);
  }

  async tokenInfoPCSV2Api(address, pairIndex) {
    let i = 0;
    while (i < 5)
      try {
        const response = await axios.get(
          `https://api.pancakeswap.info/api/v2/tokens/${address}`,
        );
        return response.data;
      } catch (error) {
        console.log(
          address,
          `panackeswap api error with pair :try again ${i} times`,
          pairIndex,
        );
        i++;
      }
  }

  async getPairInfobyIndex(pairIndex, pcsV2Contract) {
    let i = 0;
    while (i < 5) {
      try {
        console.log(pairIndex);
        const pairAddress = await pcsV2Contract.methods
          .allPairs(pairIndex)
          .call();
        const pairContract = this.getV2PairContract(pairAddress);
        const [token0, token1, reserves] = await Promise.all([
          pairContract.methods.token0().call(),
          pairContract.methods.token1().call(),
          pairContract.methods.getReserves().call(),
        ]);

        try {
          const token0Contract = this.getERC20Contract(token0);
          const token1Contract = this.getERC20Contract(token1);

          const [token0Decimals, token1Decimals] = await Promise.all([
            token0Contract.methods.decimals().call(),
            token1Contract.methods.decimals().call(),
          ]);

          const [pcsV2ResultToken0, pcsV2ResultToken1] = await Promise.all([
            this.tokenInfoPCSV2Api(token0, pairIndex),
            this.tokenInfoPCSV2Api(token1, pairIndex),
          ]);

          let reserve_usd = 0;
          if (token0 === WBNB_ADDRESS) {
            reserve_usd =
              (pcsV2ResultToken0.data.price * reserves._reserve0 * 2) /
              10 ** 18;
          } else if (token1 === WBNB_ADDRESS) {
            reserve_usd =
              (pcsV2ResultToken1.data.price * reserves._reserve1 * 2) /
              10 ** 18;
          } else if (
            BIG_TOKEN_ADDRESSES.filter(
              (item) =>
                item.isStable &&
                (item.address === token0 || item.address === token1),
            ).length > 0
          ) {
            BIG_TOKEN_ADDRESSES.forEach((item) => {
              if (item.address === token0) {
                reserve_usd =
                  ((item.price * reserves._reserve0) / 10 ** token0Decimals) *
                  2;
              } else if (item.address === token1) {
                reserve_usd =
                  ((item.price * reserves._reserve1) / 10 ** token1Decimals) *
                  2;
              }
            });
          } else {
            const reserve1 =
              (parseFloat(pcsV2ResultToken1.data.price) * reserves._reserve1) /
              10 ** token1Decimals;
            const reserve0 =
              (parseFloat(pcsV2ResultToken0.data.price) * reserves._reserve0) /
              10 ** token0Decimals;
            reserve_usd = 2 * (reserve1 < reserve0 ? reserve1 : reserve0);
          }
          if (reserves._reserve0 == 0 || reserves._reserve1 == 0) {
          } else {
            pcsV2ResultToken1.data.price =
              (reserve_usd / 2 / reserves._reserve1) * 10 ** token1Decimals;
            pcsV2ResultToken0.data.price =
              (reserve_usd / 2 / reserves._reserve0) * 10 ** token0Decimals;
          }

          const updateDBItem = {
            pairIndex,
            pairAddress,
            token0,
            token1,
            token0Name: pcsV2ResultToken0.data.name,
            token1Name: pcsV2ResultToken1.data.name,
            token0Symbol: pcsV2ResultToken0.data.symbol,
            token1Symbol: pcsV2ResultToken1.data.symbol,
            token0Decimals,
            token1Decimals,
            reserve0: reserves._reserve0,
            reserve1: reserves._reserve1,
            token0Price: parseFloat(pcsV2ResultToken0.data.price),
            token1Price: parseFloat(pcsV2ResultToken1.data.price),
            reserve_usd,
          };

          console.log(pairIndex);
          this.pairModel
            .findOneAndUpdate({ pairIndex }, updateDBItem, {
              upsert: true,
            })
            .exec();
          return updateDBItem;
        } catch (error) {
          console.log('error with processing pair', pairAddress, pairIndex);
          i++;
          this.changeWeb3RpcUrl();
        }
      } catch (error) {
        console.log('error', pairIndex);
        i++;
        this.changeWeb3RpcUrl();
      }
    }
  }

}