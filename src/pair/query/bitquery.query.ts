import { CoinPriceQuery } from '../interfaces/coinPrice.interface';

export const DEX_TRADE_PER_INTERVAL = (candleQuery: CoinPriceQuery) => {
  const { from, to, interval, baseAddress, quoteAddress } = candleQuery;
  console.log(
    new Date(from * 1000).toISOString(),
    new Date(to * 1000).toISOString(),
  );
  return {
    query: `
        query (
            $baseAddress: String
            $quoteAddress: String
            $from: ISO8601DateTime!
            $to: ISO8601DateTime!
            $interval: Int!
        ) {
            ethereum(network: bsc) {
                dexTrades(
                    options: { asc: "timeInterval.minute" }
                    time: { since: $from, till: $to }
                    baseCurrency: { is: $baseAddress }
                    quoteCurrency: { is: $quoteAddress }
                ) {
                    timeInterval {
                        minute(count: $interval, format: "%Y-%m-%dT%H:%M:%SZ")
                    }
                    volume: quoteAmount
                    high: quotePrice(calculate: maximum)
                    low: quotePrice(calculate: minimum)
                    open: minimum(of: block, get: quote_price)
                    close: maximum(of: block, get: quote_price)
                }
            }
        }
    `,
    variables: {
      from: new Date(from * 1000).toISOString(),
      to: new Date(to * 1000).toISOString(),
      interval: Number(interval),
      baseAddress,
      quoteAddress,
    },
  };
};

export const CONTRACT_CREATION_BLOCK = (contractAddress: string) => {
  return {
    query: `
      query( $contractAddress: String) {
        ethereum (network:bsc){
            smartContractCalls(
                smartContractMethod: {is: "Contract Creation"}, 
                smartContractAddress: {is: $contractAddress}
            ) {
                block {
                    height
                    timestamp {
                        unixtime
                    }
                }
            }
        }
    }
    `,
    variables: {
      contractAddress,
    },
  };
};
