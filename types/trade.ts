export type TransactionAction =
  | "BUY"
  | "ADD"
  | "TRIM"
  | "CLOSE"
  | "DEPOSIT"
  | "WITHDRAW"
  | "ADJUST_CASH";

export interface IPortfolioTransaction {
  transaction_id: string;
  portfolio?: string;
  position_id?: string | null;
  symbol: string; // Ticker or "CASH"
  action: TransactionAction;
  date: string | Date;
  shares?: number | null;
  price?: number | null;
  amount: number;
  affectCash: boolean;
  notes?: string | null;
  costBasisAtSale?: number | null;
  realizedPnlDollars?: number | null;
  realizedPnlPercent?: number | null;
  spyPriceAtDate?: number | null;
}

export interface ILongPositionV2 {
  position_id: string;
  portfolio?: string;
  symbol: string;
  status: "OPEN" | "CLOSED";
  openedDate: string | Date;
  closedDate?: string | Date | null;
  currentShares: number;
  averageCostBasis: number;
  totalCostBasis: number;
  totalCapitalInvested: number;
  totalSharesBought: number;
  totalSharesSold: number;
  totalSaleProceeds: number;
  averageExitPrice?: number | null;
  realizedPnlDollars: number;
  realizedPnlPercent: number;
  benchmarkCostBasisSpy?: number | null;
  lastKnownPrice?: number | null;
  notes?: string | null;
}

export interface IPortfolioSummary {
  portfolio?: string;
  cashBalance: number;
  totalNetDeposited: number;
  benchmarkSpyShares: number;
  benchmarkAvgCostSpy: number;
  totalRealizedPnlDollars: number;
  lastKnownSpyPrice?: number | null;
  inceptionDate?: string | Date | null;
  lastUpdated: string | Date;
}

export interface IQuoteInfo {
  symbol: string;
  price: number;
  previousClose?: number;
  changePercent?: number;
  ytdStartPrice?: number;
  ytdChangePercent?: number;
}

export interface IChartPoint {
  timestamp: string;
  price: number;
}