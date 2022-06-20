import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BIG_TOKEN_ADDRESSES,
  BUSD_ADDRESS,
  DEX_LIST,
  getRandRpcElseOne,
  WBNB_ADDRESS,
} from 'src/helpers/constants';
import { Pair, PairDocument } from './schemas/pair.schema';

import * as ABI_UNISWAP_V2_FACTORY from 'src/helpers/abis/ABI_UNISWAP_V2_FACTORY.json';
import * as ABI_UNISWAP_V2_PAIR from 'src/helpers/abis/ABI_UNISWAP_V2_PAIR.json';
import { CronService } from './cron.service';

@Injectable()
export class PairService {
  private web3;
  private rpcUrl: string;

  constructor(
    @InjectModel(Pair.name) private readonly model: Model<PairDocument>,
    private readonly cronService: CronService,
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

  async findTop(length: number): Promise<Pair[]> {
    return await this.model
      .find({})
      .sort({ reserve_usd: -1 })
      .limit(100)
      .exec();
  }

  async findOne(pairAddress: string): Promise<Pair> {
    return await this.model.findOne({ pairAddress }).exec();
  }
  async findByTokenAddress(tokenAddress: string): Promise<Pair[]> {
    return await this.model
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
    return await this.model.findOne({ pairIndex }).exec();
  }
  async search(query: string): Promise<Pair[]> {
    return await this.model
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
    const bestPairs = await this.model
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
    dexIdList = dexIdList.filter((item, index) => pairAddresses[index] != 0);
    pairAddresses = pairAddresses.filter((item) => item != 0);

    let pairArray = await Promise.all(
      pairAddresses.map((pairAddress) =>
        this.cronService.getPairInfoByAddress(pairAddress),
      ),
    );
    const result = pairArray.map((resultItem, index) => {
      const updateDBItem = { ...resultItem, dexId: dexIdList[index].index };
      this.model
        .findOneAndUpdate(
          { pairAddress: updateDBItem.pairAddress },
          updateDBItem,
          {
            upsert: true,
          },
        )
        .exec();
      return updateDBItem;
    });

    return result;
  }
}
