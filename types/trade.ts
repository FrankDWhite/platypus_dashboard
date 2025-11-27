export interface IOpenTrade {
  trade_id: string;
  ticker: string;
  description: string;
  quantity: number;
  openedTime: Date;
  purchasePrice: number;
  changePercent: number;
  changeDollars: number;
}

export interface IHistoricalTrade extends IOpenTrade {
  soldPrice: number;
  closedTime: Date;
}

export interface ITradeDatapoint {
  trade_id: string;
  timestamp: Date;
  currentPrice: number;
}

export interface ISystemConfig {
  status: string;
  profitYTD: number;
  lastUpdated: Date;
}