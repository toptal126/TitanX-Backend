export interface CoinPriceCandle {
  time: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
}

export interface CoinPriceQuery {
  from: number;
  to: number;
  interval: number;
  baseAddress?: string;
  quoteAddress?: string;
}

export interface CreationBlock {
  height: number;
  timestamp: {
    unixtime: number;
  };
}

export interface SwapLogsQuery {
  toBlock?: any;
  queryCnt?: number;
}
export interface SwapLogsResult {
  creationBlock: number;
  fromBlock: number;
  toBlock: number;
  isFinished: boolean;
  logs: any[];
}

export interface BitQueryTradeInterval {
  timeInterval: {
    minute: string;
  };
  volume: number;
  high: number;
  low: number;
  open: number;
  close: number;
}

export interface TokenInformation {
  id: string;
  symbol?: string;
  name?: string;
  price?: number;
  minted: number;
  burned: number;
  decimals: number;
  pair: string;
  isToken1BNB: boolean;
  isToken1BUSD: boolean;
  isBUSDPaired: boolean;
}
