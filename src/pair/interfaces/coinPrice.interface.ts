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
  symbol: string;
  name: string;
  price: number;
  minted: number;
  burned: number;
  decimals: number;
}
