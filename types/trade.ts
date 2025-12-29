/**
 * This represents a position that the AI model (Platypus V2) has taken on a stock option contract.
 * trade_id is the unique identifier for this action and it will keep this id once it transitions to a historical trade.
 * Being profitable so far (or having won a previous trade) should have a "green" vibe, and a "red" vibe if a loss
 */
export interface IOpenTrade {
  trade_id: string;
  ticker: string;
  description: string;
  quantity: number;
  openedTime: Date;
  purchasePrice: number;
  changePercent: number; //this will remain 0 until the trade is closed. rely on combination of the latest TradeDatapoint and purchasePrice for latest P/L
  changeDollars: number; //this will remain 0 until the trade is closed. rely on combination of the latest TradeDatapoint and purchasePrice for latest P/L
}

export interface IHistoricalTrade extends IOpenTrade {
  soldPrice: number;
  closedTime: Date;
}

/**
 * This represents a particular point in a graph for an open (or closed) trade. the trade_id
 * will match a IOpenTrade or IHistoricalTrade.
 */
export interface ITradeDatapoint {
  trade_id: string;
  timestamp: Date;
  currentPrice: number;
}

/**
 * These are a couple of system diagnostics and overall performance. they could be displayed in some sort of status UI
 */
export interface ISystemConfig {
  status: string;
  profitYTD: number;
  lastUpdated: Date;
}

export interface ILongPosition {
  symbol: string; // The ticker for the long equity position
  quantity: number; // number of shares owned 
  costBasis: number; // investment before any unrealized gain/loss (PER SHARE)
  percentChange: number; // profit or loss on the position (percentage)
  totalValue: number; // total investment value now
}