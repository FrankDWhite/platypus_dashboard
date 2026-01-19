"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import {
  IOpenTrade,
  IHistoricalTrade,
  ITradeDatapoint,
  ISystemConfig,
  ILongTermPerformance,
} from "@/types/trade";
import SystemStatus from "./SystemStatus";
import LongTermPerformanceCard from "./LongTermPerformanceCard";

const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
);
const TrendingDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
);
const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
);

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

const formatPercent = (val: number) => {
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
};

const getOrdinalNum = (n: number) => {
  return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
};

const formatDateTimeCentral = (dateInput: Date | string) => {
  const date = new Date(dateInput);
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);
  
  const part = (type: string) => parts.find(p => p.type === type)?.value || '';
  
  const time = `${part('hour')}:${part('minute')} ${part('dayPeriod')}`;
  const weekday = part('weekday');
  const month = part('month');
  const day = part('day');
  const dayWithSuffix = getOrdinalNum(parseInt(day, 10));
  
  return `${time} ${weekday}, ${month} ${dayWithSuffix}`;
};

const isTodayCentral = (dateInput: Date | string) => {
  const date = new Date(dateInput);
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  return formatter.format(date) === formatter.format(now);
};

const TradeDetailView = ({ 
  trade, 
  datapoints, 
  onClose,
}: { 
  trade: IOpenTrade | IHistoricalTrade; 
  datapoints: ITradeDatapoint[]; 
  onClose: () => void;
}) => {
  if (!trade) return null;

  const latestPrice = datapoints.length > 0 ? datapoints[datapoints.length - 1].currentPrice : trade.purchasePrice;
  const startPrice = trade.purchasePrice;
  const isProfit = latestPrice >= startPrice;
  const color = isProfit ? "#10b981" : "#ef4444"; 
  const profitLoss = (latestPrice - startPrice) * trade.quantity;
  const profitLossPercent = ((latestPrice - startPrice) / startPrice) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md">
        <button 
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          <ChevronLeftIcon />
        </button>
        <span className="font-semibold text-white tracking-wide">{trade.ticker}</span>
        <div className="w-8" /> {/* Spacer for centering */}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {/* Main Price Header */}
        <div className="pt-8 pb-4 px-6 text-center">
          <h1 className={`text-4xl font-bold font-mono tracking-tight mb-2 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(latestPrice)}
          </h1>
          <div className={`flex items-center justify-center gap-2 text-sm font-medium ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
            <span className="flex items-center">
              {isProfit ? <TrendingUpIcon /> : <TrendingDownIcon />}
            </span>
            <span>{formatCurrency(Math.abs(profitLoss))} ({formatPercent(profitLossPercent)})</span>
          </div>
          <p className="text-neutral-500 text-xs mt-2 uppercase tracking-wider">Total Return</p>
        </div>

        {/* Chart Section - Scrubbable */}
        <div className="h-80 w-full relative my-4 touch-none">
          {datapoints.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datapoints} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradientDetail-${trade.trade_id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} horizontal={true} />
                <XAxis 
                  dataKey="timestamp" 
                  hide={true} 
                />
                <YAxis 
                  domain={['auto', 'auto']} 
                  hide={true}
                />
                <Tooltip 
                  cursor={{ stroke: '#525252', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#fff', borderRadius: '12px', padding: '8px 12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                  itemStyle={{ color: '#fff', fontWeight: 600, fontFamily: 'monospace' }}
                  labelStyle={{ color: '#a3a3a3', fontSize: '11px', marginBottom: '4px' }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [value !== undefined && typeof value === 'number' ? formatCurrency(value) : 'N/A', "Price"]}
                />
                <ReferenceLine y={trade.purchasePrice} stroke="#525252" strokeDasharray="3 3" label={{ position: 'insideRight',  value: 'Avg', fill: '#525252', fontSize: 10 }} />
                <Area 
                  type="monotone" 
                  dataKey="currentPrice" 
                  stroke={color} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill={`url(#gradientDetail-${trade.trade_id})`} 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-neutral-600 gap-2">
              <div className="w-8 h-8 border-2 border-neutral-800 border-t-neutral-600 rounded-full animate-spin"></div>
              <span className="text-sm">Loading chart data...</span>
            </div>
          )}
        </div>

        {/* Trade Details Cards */}
        <div className="px-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
              <p className="text-xs text-neutral-500 mb-1">Your Average</p>
              <p className="text-lg font-mono text-white">{formatCurrency(trade.purchasePrice)}</p>
            </div>
            <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
              <p className="text-xs text-neutral-500 mb-1">Contracts Owned</p>
              <p className="text-lg font-mono text-white">{trade.quantity}</p>
            </div>
            <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
              <p className="text-xs text-neutral-500 mb-1">Total Equity</p>
              <p className="text-lg font-mono text-white">{formatCurrency(latestPrice * trade.quantity)}</p>
            </div>
            <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
              <p className="text-xs text-neutral-500 mb-1">Date Opened</p>
              <p className="text-sm font-mono text-white mt-1">{formatDateTimeCentral(trade.openedTime)}</p>
            </div>
            {'closedTime' in trade && (
              <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                <p className="text-xs text-neutral-500 mb-1">Date Closed</p>
                <p className="text-sm font-mono text-white mt-1">{formatDateTimeCentral((trade as IHistoricalTrade).closedTime)}</p>
              </div>
            )}
          </div>

          <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 mt-4">
            <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">Strategy Description</p>
            <p className="text-sm text-neutral-300 leading-relaxed">
              {trade.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TradeCard = ({ 
  trade, 
  latestPrice, 
  onClick 
}: { 
  trade: IOpenTrade | IHistoricalTrade; 
  latestPrice?: number;
  onClick: (trade: IOpenTrade | IHistoricalTrade) => void;
}) => {
  const isHistorical = 'soldPrice' in trade;
  const currentVal = isHistorical ? (trade as IHistoricalTrade).soldPrice : (latestPrice || trade.purchasePrice);
  const profitLoss = (currentVal - trade.purchasePrice) * trade.quantity;
  const profitLossPercent = ((currentVal - trade.purchasePrice) / trade.purchasePrice) * 100;
  const isProfit = profitLoss >= 0;

  return (
    <div 
      className="bg-neutral-900 hover:bg-neutral-800/80 active:bg-neutral-800 rounded-xl p-5 mb-3 border border-neutral-800 transition-all duration-200 cursor-pointer touch-manipulation shadow-sm"
      onClick={() => onClick(trade)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isProfit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {isProfit ? <TrendingUpIcon /> : <TrendingDownIcon />}
          </div>
          <div>
            <h4 className="font-bold text-white text-xl tracking-tight">{trade.ticker} {trade.strikePrice} {trade.optionType}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isHistorical ? 'border-neutral-700 text-neutral-500' : 'border-neutral-600 text-neutral-400'}`}>
                {isHistorical ? 'CLOSED' : 'OPEN'}
              </span>
              <span className="text-xs text-neutral-500">per contract</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-mono font-bold text-lg ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {profitLoss > 0 ? '+' : ''}{formatCurrency(profitLoss)}
          </div>
          <div className={`text-xs font-medium mt-0.5 ${isProfit ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
            {formatPercent(profitLossPercent)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-neutral-800/50">
        <div>
           <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">{isHistorical ? 'Closed' : 'Current'}</p>
           <p className="text-sm font-mono text-neutral-200">
             {latestPrice || isHistorical ? formatCurrency(currentVal) : <span className="animate-pulse">...</span>}
           </p>
           {isHistorical && (
             <p className="text-[10px] text-neutral-500 mt-1">
               {formatDateTimeCentral((trade as IHistoricalTrade).closedTime)}
             </p>
           )}
        </div>
        <div className="text-right">
           <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">Entry</p>
           <p className="text-sm font-mono text-neutral-400">{formatCurrency(trade.purchasePrice)}</p>
           <p className="text-[10px] text-neutral-500 mt-1">
             {formatDateTimeCentral(trade.openedTime)}
           </p>
        </div>
      </div>
    </div>
  );
};

export default function TradesClient() {
  const [openTrades, setOpenTrades] = useState<IOpenTrade[]>([]);
  const [historicalTrades, setHistoricalTrades] = useState<IHistoricalTrade[]>([]);
  const [longTermPerformance, setLongTermPerformance] = useState<ILongTermPerformance | null>(null);
  const [systemConfig, setSystemConfig] = useState<ISystemConfig | null>(null);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTrade, setActiveTrade] = useState<IOpenTrade | IHistoricalTrade | null>(null);
  const [activeDatapoints, setActiveDatapoints] = useState<ITradeDatapoint[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    async function loadTrades() {
      try {
        const res = await fetch("/api/trades?page=1&limit=25");
        if (!res.ok) throw new Error("Failed to fetch trades");
        const data = await res.json();
        
        setOpenTrades(data.openTrades);
        setHistoricalTrades(data.historicalTrades);
        
        if (data.historicalTrades && data.historicalTrades.length < 25) {
          setHasMore(false);
        }
        
        setLongTermPerformance(data.longTermPerformance);
        setSystemConfig(data.config || {
          status: "active",
          profitYTD: 3234,
          lastUpdated: new Date()
        });

        data.openTrades.forEach((trade: IOpenTrade) => {
          fetchLatestPrice(trade.trade_id);
        });

      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    loadTrades();
  }, []);

  const loadMoreHistory = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/trades?page=${nextPage}&limit=25`);
      if (!res.ok) throw new Error("Failed to fetch more trades");
      const data = await res.json();
      
      const newTrades = (data.historicalTrades || []) as IHistoricalTrade[];
      
      if (newTrades.length > 0) {
        setHistoricalTrades(prev => [...prev, ...newTrades]);
        setPage(nextPage);
      }
      
      if (newTrades.length < 25) {
        setHasMore(false);
      }
    } catch (e) {
      console.error("Error loading more trades:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchLatestPrice = async (tradeId: string) => {
    try {
      const res = await fetch(`/api/datapoints/${tradeId}`);
      if (res.ok) {
        const points: ITradeDatapoint[] = await res.json();
        if (points.length > 0) {
          const latest = points[points.length - 1].currentPrice;
          setCurrentPrices(prev => ({ ...prev, [tradeId]: latest }));
        }
      }
    } catch (e) {
      console.error("Price fetch error", e);
    }
  };

  const loadChartData = async (trade: IOpenTrade | IHistoricalTrade) => {
    setActiveDatapoints([]);
    try {
      const res = await fetch(`/api/datapoints/${trade.trade_id}`);
      if (res.ok) {
        const points = await res.json();
        setActiveDatapoints(points);
      }
    } catch (e) {
      console.error(e);
    }
  };


  const handleCardClick = (trade: IOpenTrade | IHistoricalTrade) => {
    setActiveTrade(trade);
    setIsDetailOpen(true);
    loadChartData(trade);
    
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => setActiveTrade(null), 300); // Wait for animation
    document.body.style.overflow = 'unset';
  };

  // Calculate Totals
  const totalOpenPL = useMemo(() => {
    return openTrades.reduce((acc, trade) => {
      const current = currentPrices[trade.trade_id] || trade.purchasePrice;
      return acc + ((current - trade.purchasePrice) * trade.quantity);
    }, 0);
  }, [openTrades, currentPrices]);

  const todayRealizedPL = useMemo(() => {
    return historicalTrades.reduce((acc, trade) => {
      if (isTodayCentral(trade.closedTime)) {
        return acc + ((trade.soldPrice - trade.purchasePrice) * trade.quantity);
      }
      return acc;
    }, 0);
  }, [historicalTrades]);

  const portfolioValue = useMemo(() => {
    return openTrades.reduce((acc, trade) => {
      const current = currentPrices[trade.trade_id] || trade.purchasePrice;
      return acc + (current * trade.quantity);
    }, 0);
  }, [openTrades, currentPrices]);


  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-neutral-800 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-neutral-500 animate-pulse text-sm">Loading Portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-rose-500">Error: {error}</div>;
  }

  return (
    // Updated Main Container: Removed max-w-md, added max-w-xl for better tablet support, reduced padding for mobile
    <div className="w-full max-w-xl mx-auto min-h-screen pb-20 relative select-none bg-black">
      
      {/* Header / Summary Card */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-neutral-800 p-5 pt-12 pb-5 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Platypus Options Signal Dashboard</h1>
          <Link href="/long-positions" className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 rounded transition-colors">
            Longs &rarr;
          </Link>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${totalOpenPL >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {totalOpenPL >= 0 ? '+' : ''}{formatCurrency(totalOpenPL)}
          </span>
          <span className="text-xs text-neutral-500 font-medium">P/L Open</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${todayRealizedPL >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {todayRealizedPL >= 0 ? '+' : ''}{formatCurrency(todayRealizedPL)}
          </span>
          <span className="text-xs text-neutral-500 font-medium">P/L Today</span>
        </div>
      </div>

      <div className="px-3 md:px-4">
        {/* System Status Integration */}
        {systemConfig && <SystemStatus systemConfig={systemConfig} />}

        {/* Long Term Performance Section */}
        {longTermPerformance && <LongTermPerformanceCard performance={longTermPerformance} />}

        {/* Open Trades Section */}
        <div className="mb-8 mt-6">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 ml-1">Open Positions</h2>
          {openTrades.length === 0 ? (
            <p className="text-neutral-600 text-sm italic ml-1">No open positions.</p>
          ) : (
            openTrades.map((trade) => (
              <TradeCard 
                key={trade.trade_id} 
                trade={trade} 
                latestPrice={currentPrices[trade.trade_id]}
                onClick={handleCardClick}
              />
            ))
          )}
        </div>

        {/* Historical Trades Section */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 ml-1">History (Recent)</h2>
          {historicalTrades.map((trade) => (
            <TradeCard 
              key={trade.trade_id} 
              trade={trade} 
              onClick={handleCardClick}
            />
          ))}
          
          {hasMore && (
            <button 
              onClick={loadMoreHistory}
              disabled={loadingMore}
              className="w-full py-3 mt-4 rounded-xl border border-neutral-800 bg-neutral-900/50 text-neutral-400 text-sm font-medium hover:bg-neutral-800 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-neutral-600 border-t-neutral-400 rounded-full animate-spin"></span>
                  Loading...
                </span>
              ) : (
                "Load More History"
              )}
            </button>
          )}
        </div>
        
        <div className="text-center text-xs text-neutral-800 py-8 pb-24">
          <p>Tap any trade to view details and performance.</p>
          <p className="mt-2">Platypus Dashboard v2.1</p>
        </div>
      </div>

      {/* Full Screen Detail Modal */}
      {isDetailOpen && activeTrade && (
        <TradeDetailView 
          trade={activeTrade} 
          datapoints={activeDatapoints} 
          onClose={handleCloseDetail} 
        />
      )}
    </div>
  );
}