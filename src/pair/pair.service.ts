import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoClient } from 'mongodb';
import {
  BIG_TOKEN_ADDRESSES,
  BUSD_ADDRESS,
  DEX_LIST,
  getRandRpcElseOne,
  RPC_LIST,
  WBNB_ADDRESS,
} from 'src/helpers/constants';
import { Pair, PairDocument } from './schemas/pair.schema';
import { Document } from 'bson';
import * as ABI_UNISWAP_V2_FACTORY from 'src/helpers/abis/ABI_UNISWAP_V2_FACTORY.json';
import * as ABI_UNISWAP_V2_PAIR from 'src/helpers/abis/ABI_UNISWAP_V2_PAIR.json';
import { CronService } from './cron.service';
import {
  CreationBlock,
  SwapLogsQuery,
  SwapLogsResult,
} from './interfaces/coinPrice.interface';
import { CoinPriceService } from './coinPrice.service';
import { CoinPrice, CoinPriceDocument } from './schemas/coinPrice.schema';

require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI;

@Injectable()
export class PairService {
  private web3;
  private rpcUrl: string;
  private coinPriceCollection: Document;

  constructor(
    @InjectModel(Pair.name) private readonly pairModel: Model<PairDocument>,
    @InjectModel(Pair.name)
    private readonly coinPriceModel: Model<CoinPrice>,
    private readonly cronService: CronService,
    private readonly coinPriceService: CoinPriceService,
  ) {
    const Web3 = require('web3');
    this.rpcUrl = getRandRpcElseOne('');
    this.web3 = new Web3(this.rpcUrl);

    MongoClient.connect(`${MONGODB_URI}`).then((client: MongoClient) => {
      this.coinPriceCollection = client
        .db('native_coin_history')
        .collection('bsc');
    });
  }

  changeWeb3RpcUrl = (rpcUrl = null) => {
    const Web3 = require('web3');
    if (rpcUrl) {
      this.rpcUrl = rpcUrl;
      this.web3 = new Web3(this.rpcUrl);
      return;
    }
    this.rpcUrl = getRandRpcElseOne(this.rpcUrl);
    this.web3 = new Web3(this.rpcUrl);
  };

  async findTop(length: number): Promise<Pair[]> {
    return await this.pairModel
      .find({})
      .sort({ reserve_usd: -1 })
      .limit(100)
      .exec();
  }

  async findOne(pairAddress: string): Promise<Pair> {
    return await this.pairModel.findOne({ pairAddress }).exec();
  }
  async findByTokenAddress(tokenAddress: string): Promise<Pair[]> {
    return await this.pairModel
      .find({
        $or: [
          { token0: { $regex: `${tokenAddress}`, $options: 'i' } },
          { token1: { $regex: `${tokenAddress}`, $options: 'i' } },
        ],
      })
      .sort({ reserve_usd: -1 })
      .limit(10)
      .exec();
  }

  async findByIndex(pairIndex: string): Promise<Pair> {
    return await this.pairModel.findOne({ pairIndex }).exec();
  }
  async search(query: string): Promise<Pair[]> {
    return await this.pairModel
      .find({
        $or: [
          { pairAddress: { $regex: `${query}`, $options: 'i' } },
          { token0: { $regex: `${query}`, $options: 'i' } },
          { token0Name: { $regex: `${query}`, $options: 'i' } },
          { token0Symbol: { $regex: `${query}`, $options: 'i' } },
          { token1: { $regex: `${query}`, $options: 'i' } },
          { token1Name: { $regex: `${query}`, $options: 'i' } },
          { token1Symbol: { $regex: `${query}`, $options: 'i' } },
        ],
      })
      .sort({ reserve_usd: -1 })
      .limit(100)
      .exec();
  }

  async findBestPair(baseTokenAddress: string): Promise<Pair> {
    const bestPairs = await this.pairModel
      .find({
        $or: [
          {
            token0: { $regex: BUSD_ADDRESS, $options: 'i' },
            token1: { $regex: baseTokenAddress, $options: 'i' },
          },
          {
            token0: { $regex: baseTokenAddress, $options: 'i' },
            token1: { $regex: BUSD_ADDRESS, $options: 'i' },
          },
          {
            token0: { $regex: WBNB_ADDRESS, $options: 'i' },
            token1: { $regex: baseTokenAddress, $options: 'i' },
          },
          {
            token0: { $regex: baseTokenAddress, $options: 'i' },
            token1: { $regex: WBNB_ADDRESS, $options: 'i' },
          },
        ],
      })
      .exec();
    let result: Pair = bestPairs[0];
    bestPairs.forEach((item) => {
      if (item.token0 == WBNB_ADDRESS || item.token1 == WBNB_ADDRESS)
        result = item;
    });
    return result;
  }

  async getPairInfoByAddress(pairAddress: string) {
    const pairContract = new this.web3.eth.Contract(
      ABI_UNISWAP_V2_PAIR,
      pairAddress,
    );

    const [token0, token1, reserves] = await Promise.all([
      pairContract.methods.token0().call(),
      pairContract.methods.token1().call(),
      pairContract.methods.getReserves().call(),
    ]);
    // let pair: Pair;
  }

  async findPairsFromDEX(baseTokenAddress: string): Promise<Pair[]> {
    try {
      this.web3.utils.toChecksumAddress(baseTokenAddress);
    } catch (error) {
      throw new HttpException('Invalid Token Address', HttpStatus.BAD_REQUEST);
    }
    let i = 0;
    while (i < 5) {
      try {
        let factoryContracts = [];
        DEX_LIST.forEach((item) => {
          factoryContracts.push(
            new this.web3.eth.Contract(
              ABI_UNISWAP_V2_FACTORY,
              item.factory_address,
            ),
          );
        });
        let pairAddresses = await Promise.all(
          [].concat.apply(
            [],
            factoryContracts.map((factoryContract) =>
              BIG_TOKEN_ADDRESSES.map((token) =>
                factoryContract.methods
                  .getPair(baseTokenAddress, token.address)
                  .call(),
              ),
            ),
          ),
        );
        let dexIdList = [].concat.apply(
          [],
          DEX_LIST.map((DEX, index) =>
            BIG_TOKEN_ADDRESSES.map((token) => {
              return { index, token };
            }),
          ),
        );
        dexIdList = dexIdList.filter(
          (item, index) => pairAddresses[index] != 0,
        );
        pairAddresses = pairAddresses.filter((item) => item != 0);

        let pairArray = await Promise.all(
          pairAddresses.map((pairAddress) =>
            this.cronService.getPairInfoByAddress(pairAddress),
          ),
        );
        const result = [];
        pairArray.forEach((resultItem, index) => {
          if (resultItem === null) return;
          const updateDBItem = { ...resultItem, dexId: dexIdList[index].index };
          this.pairModel
            .findOneAndUpdate(
              { pairAddress: updateDBItem.pairAddress },
              updateDBItem,
              {
                upsert: true,
              },
            )
            .exec();
          result.push(updateDBItem);
        });

        return result;
      } catch (error) {
        i++;
        this.changeWeb3RpcUrl();
      }
    }
    throw new HttpException(
      'Internal Server Error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  async getLastSwapLogs(
    pairAddress: string,
    swapLogsQuery: SwapLogsQuery,
  ): Promise<SwapLogsResult> {
    const pair: PairDocument = await this.pairModel
      .findOne({ pairAddress })
      .exec();
    const cap = 100000;
    if (swapLogsQuery.toBlock === 'latest') {
      swapLogsQuery.toBlock = await this.web3.eth.getBlockNumber();
    }
    let toBlock: number = swapLogsQuery.toBlock;
    let fromBlock: number;
    let scanBlockRange: number = 200;
    const MAX_BLOCK_REQUEST: number = 4000;
    let result = [];
    let pairContract;

    let rpcStart = 0;
    try {
      pairContract = new this.web3.eth.Contract(
        ABI_UNISWAP_V2_PAIR,
        pairAddress,
      );
    } catch (error) {
      throw new HttpException('Invalid Token Address', HttpStatus.BAD_REQUEST);
    }

    let creation_block: number = pair.creation_block;
    if (!pair.creation_block) {
      const pairCreation: CreationBlock =
        await this.coinPriceService.getCreationBlock(pairAddress);
      creation_block = pairCreation.height;
      const updateDBItem = {
        ...pair.toObject(),
        creation_block: creation_block,
      };
      const res = await this.pairModel
        .findOneAndUpdate({ pairAddress }, updateDBItem)
        .exec();
    }

    while (
      result.length < swapLogsQuery.queryCnt &&
      toBlock > creation_block &&
      swapLogsQuery.toBlock - cap < toBlock
    ) {
      fromBlock = Math.max(toBlock - scanBlockRange, creation_block);

      let fromArr: number[];
      let toArr: number[];
      fromArr = [];
      toArr = [];
      let curFrom = toBlock,
        curTo = toBlock;
      do {
        toArr.push(curTo);
        curFrom -= Math.min(MAX_BLOCK_REQUEST, scanBlockRange);
        fromArr.push(curFrom >= fromBlock ? curFrom : fromBlock);
        curTo = curFrom - 1;
      } while (curFrom > fromBlock);
      let logs: any[];
      try {
        logs = await Promise.all(
          fromArr.map((item, index) => {
            this.changeWeb3RpcUrl(
              RPC_LIST[(index % RPC_LIST.length) + rpcStart],
            );
            rpcStart = RPC_LIST.length / 2 - rpcStart;

            pairContract = new this.web3.eth.Contract(
              ABI_UNISWAP_V2_PAIR,
              pairAddress,
            );
            return pairContract.getPastEvents('Swap', {
              fromBlock: fromArr[index],
              toBlock: toArr[index],
            });
          }),
        );
      } catch (error) {
        console.log(this.rpcUrl, error);
      }
      logs = [].concat.apply([], logs);

      toBlock = toBlock - scanBlockRange - 1;
      if (logs.length < 20) {
        scanBlockRange = Math.min(
          (RPC_LIST.length * MAX_BLOCK_REQUEST) / 2,
          scanBlockRange * 5,
        );
      } else if (logs.length >= 500) {
        scanBlockRange = scanBlockRange / 5;
      }
      if (logs.length) {
        logs = logs.map((item) => {
          return {
            blockNumber: item.blockNumber,
            returnValues: item.returnValues,
            transactionHash: item.transactionHash,
          };
        });

        result = result.concat(logs.reverse());
      }
      // return logs.reverse();
    }
    let st = new Date().getTime() / 1000;
    let timeStampArr: number[] = await Promise.all(
      result.map((log) =>
        this.coinPriceService.getBlockTimeStampByNumber(log.blockNumber),
      ),
    );

    let blockTimeStampArr: number[] = timeStampArr.map((_timeStamp) => {
      const timeStamp = _timeStamp - (_timeStamp % 60);
      return timeStamp;
    });

    let coinPriceArr: CoinPrice[] = await this.coinPriceCollection
      .find({
        timeStamp: { $in: blockTimeStampArr },
      })
      .toArray();
    result.forEach((log, index) => {
      log.timeStamp = timeStampArr[index];
      log.coinPrice = coinPriceArr.find(
        (item) => item.timeStamp == blockTimeStampArr[index],
      )?.usdPrice;
    });
    return {
      creationBlock: creation_block,
      fromBlock,
      toBlock: swapLogsQuery.toBlock,
      isFinished: fromBlock <= creation_block,
      logs: result,
    };
  }
}
