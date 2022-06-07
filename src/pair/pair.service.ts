import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BUSD_ADDRESS, WBNB_ADDRESS } from 'src/helpers/constants';
import { Pair, PairDocument } from './schemas/pair.schema';

@Injectable()
export class PairService {
  constructor(
    @InjectModel(Pair.name) private readonly model: Model<PairDocument>,
  ) {}

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
}
