import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Document, Types } from 'mongoose';

export type ProfileDocument = Profile & Document;

@Schema()
export class Profile {
  @Prop({ required: true, unique: true })
  username: string;
  @Prop({ required: true, unique: true })
  wallet: string;
  @Prop({ required: true, default: false })
  verified: boolean;

  @Prop({ required: true })
  uuid: string;
  @Prop()
  bio: string;

  @Prop()
  avatarLink: string;

  @Prop({ type: Object })
  clientLocation: {
    ip: string;
    countrycode: string;
    countryname: string;
  };

  @Prop()
  bannerLink: string;

  @Prop({ required: true, default: 0 })
  articleNumber: number;

  @Prop({ required: true, default: 0 })
  presaleNumber: number;

  @Prop({ required: true, default: [] })
  followers: Array<string>; // array of wallet
  @Prop({ required: true, default: [] })
  following: Array<string>; // array of wallet

  @Prop({ required: true, default: false })
  featured: boolean;

  @Prop({ required: true, default: 0 })
  totalContribution: number;

  @Prop({
    type: Object,
    required: true,
    default: { coinQuote: 0, tokenQuote: 0, totalQuote: 0 },
  })
  balanceQuote: {
    coinQuote: number; // native coin
    tokenQuote: number; // erc20  + erc721
    totalQuote: number; // total
  };

  // for ERC20
  @Prop({ required: true, default: [] })
  tokenAssets: Array<{
    name: string;
    symbol: string;
    quote: number;
    quoteRate: number;
    balance: number;
    contract: string;
    decimals: number;
  }>;
  // for ERC721
  @Prop({ required: true, default: [] })
  nftAssets: Array<{
    name: string;
    symbol: string;
    quote: number;
    quoteRate: number;
    balance: number;
    contract: string;
    nftData: Array<{
      tokenId: number;
      externalData: any;
    }>;
  }>;

  @Prop({ required: true, default: 0 })
  exp: 0;

  @Prop({ required: true, default: [] })
  expLog: Array<{
    point: number;
    description: string;
  }>;

  @Prop({ required: true })
  createdAt: Date;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

/*
Level Up System
1. 1
2. 100
3. 200
4. 1000
5. 2000
6. 3000
7. 4000
8. 5000
9. 7000
10. 9000
11. 11000
12. 13000
13. 15000
14. 17000
15. 21000

Create Presale - Increase 1000
Contribute Presale - 100
Like Presale - Increase 1
Writing Post - Increase 10
Reply Post - Increase 2
Get Report - Decrease 10
Get Followed - Increase 3
Follow Somebody - Increase 1
Post Get Clapped - Increase 5
Clap Post - Increase 1
Set NFT as Profile - Increase 3
Mint NFT - Increase 100
Mint Kangaroose NFT - Increase 100
*/
