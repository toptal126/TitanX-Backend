export const PANCAKESWAP_V2_FACTORY =
  '0xca143ce32fe78f1f7019d7d551a6402fc5350c73';
export const WBNB_BUSD_PAIR = '0x58f876857a02d6762e0101bb5c46a8c1ed44dc16';
export const LOG_TOPIC_SWAP =
  '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822';

export const WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
export const BUSD_ADDRESS = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';

export const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const BIG_TOKEN_ADDRESSES = [
  {
    // Wrapped BNB, WBNB
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    isPeggedToBNB: true,
  },
  {
    // Tether USD, USDT
    address: '0x55d398326f99059fF775485246999027B3197955',
    isStable: true,
    price: 1,
  },
  {
    // BUSD Token, BUSD
    address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    isStable: true,
    price: 1,
  },
  {
    // USD Coin, USDC
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    isStable: true,
    price: 1,
  },
  {
    // TrueUSD, TUSD
    address: '0x14016E85a25aeb13065688cAFB43044C2ef86784',
    isStable: true,
    price: 1,
  },
];

export const DEX_LIST = [
  {
    name: 'Pancakeswap',
    factory_address: '0xca143ce32fe78f1f7019d7d551a6402fc5350c73', // Pancakeswap
  },
  {
    name: 'Biswap',
    factory_address: '0x858e3312ed3a876947ea49d572a7c42de08af7ee', // Biswap
  },
  {
    name: 'ApeSwap',
    factory_address: '0x0841bd0b734e4f5853f0dd8d7ea041c241fb0da6', // ApeSwap
  },
  {
    name: 'BakerySwap',
    factory_address: '0x01bf7c66c6bd861915cdaae475042d3c4bae16a7', // BakerySwap
  },
  {
    name: 'NomiSwap',
    factory_address: '0xd6715a8be3944ec72738f0bfdc739d48c3c29349', //NomiSwap
  },
];

export const RPC_LIST = [
  'https://rpc.ankr.com/bsc',
  'https://bsc-dataseed1.binance.org/',
  'https://bsc-dataseed2.binance.org/',
  'https://bsc-dataseed3.binance.org/',
  'https://bsc-dataseed4.binance.org/',
  'https://bsc-dataseed1.defibit.io/',
  'https://bsc-dataseed2.defibit.io/',
  'https://bsc-dataseed3.defibit.io/',
  'https://bsc-dataseed4.defibit.io/',
  'https://bsc-dataseed1.ninicoin.io/',
  'https://bsc-dataseed2.ninicoin.io/',
  'https://bsc-dataseed3.ninicoin.io/',
  'https://bsc-dataseed4.ninicoin.io/',
];

export const getRandRpcElseOne = (rpc) => {
  const array = RPC_LIST.filter((item) => item != rpc);
  return array[Math.floor(Math.random() * array.length)];
};

/*
const RPC_LIST = [
  'https://bsc.mytokenpocket.vip',
  'https://bsc-dataseed3.binance.org',
  'https://bsc-dataseed1.defibit.io',
  'https://bsc-dataseed1.binance.org',
  'https://bsc-dataseed2.binance.org',
  'https://bsc-dataseed4.binance.org',
  'https://bsc-dataseed2.defibit.io',
  'https://bsc-dataseed.binance.org',
  // 'https://rpc.ankr.com/bsc',
  'https://bsc-dataseed3.ninicoin.io',
  'https://bsc-dataseed2.ninicoin.io',
  'https://bsc-dataseed3.defibit.io',
  'https://bsc-dataseed1.ninicoin.io',
  'https://bsc-dataseed4.defibit.io',
  'https://binance.nodereal.io',
  'https://rpc-bsc.bnb48.club',
  'https://bscrpc.com',
  'https://bsc-dataseed4.ninicoin.io',
];

*/

export const mainnetRpcURL =
  'https://mainnet.infura.io/v3/2c5f30f7c7804ae1bd5b7440758e4a1c';
export const ropstenRpcURL =
  'https://ropsten.infura.io/v3/2c5f30f7c7804ae1bd5b7440758e4a1c';
export const rinkebyRpcURL =
  'https://rinkeby.infura.io/v3/2c5f30f7c7804ae1bd5b7440758e4a1c';

export const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffff';
export const ERC20_ADDRESS = '0xa067ce4acaf755aaee4c3fbe5c5057ec4dfce348';
export const USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7';

export const SPENDER = '0xADcEd6393F653fb2C9746f4fD0F80E13E0cBa0e4';

export const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
export const PRIVATE_KEY =
  'b0b889f4de84164f7487f190f0f008b819308211598657b1f2d7dff8921d6d8e';
export const MY_ADDRESS = '0x41d4C8894B529d50Eb82A1c183019e883C77d1DB';
