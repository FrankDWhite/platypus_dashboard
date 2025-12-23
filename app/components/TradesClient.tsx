"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
} from "@/types/trade";
import SystemStatus from "./SystemStatus";

const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
);
const TrendingDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
);
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
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


const QuickChartOverlay = ({ 
  trade, 
  datapoints, 
  visible 
}: { 
  trade: IOpenTrade | IHistoricalTrade; 
  datapoints: ITradeDatapoint[]; 
  visible: boolean 
}) => {
  if (!visible || !trade) return null;

  const latestPrice = datapoints.length > 0 ? datapoints[datapoints.length - 1].currentPrice : trade.purchasePrice;
  const startPrice = trade.purchasePrice;
  const isProfit = latestPrice >= startPrice;
  const color = isProfit ? "#10b981" : "#ef4444"; // emerald-500 : rose-500

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in touch-none">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-start bg-neutral-800/30">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {trade.ticker}
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-neutral-700 text-neutral-300">
                {trade.quantity} shares
              </span>
            </h3>
            <p className="text-sm text-neutral-400 mt-1">{trade.description}</p>
          </div>
          <div className="text-right">
            <p className={`text-xl font-bold font-mono ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(latestPrice)}
            </p>
            <p className={`text-xs font-medium ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isProfit ? '▲' : '▼'} {formatPercent(((latestPrice - startPrice) / startPrice) * 100)}
            </p>
          </div>
        </div>
        
        <div className="h-64 w-full bg-neutral-900 relative">
          {datapoints.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datapoints} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`colorGradient-${trade.trade_id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                  dataKey="timestamp" 
                  hide={true} 
                />
                <YAxis 
                  domain={['auto', 'auto']} 
                  tick={{fill: '#525252', fontSize: 10}}
                  tickFormatter={(val) => `$${val.toFixed(0)}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#fff', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ display: 'none' }}
                  formatter={(value: number) => [formatCurrency(value), "Price"]}
                />
                <ReferenceLine y={trade.purchasePrice} stroke="#525252" strokeDasharray="3 3" label={{ position: 'right',  value: 'Avg', fill: '#525252', fontSize: 10 }} />
                <Area 
                  type="monotone" 
                  dataKey="currentPrice" 
                  stroke={color} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill={`url(#colorGradient-${trade.trade_id})`} 
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
              No chart data available
            </div>
          )}
        </div>
        <div className="p-3 bg-neutral-800/30 text-center text-xs text-neutral-500">
          Hold to keep viewing • Release to close
        </div>
      </div>
    </div>
  );
};

const TradeCard = ({ 
  trade, 
  latestPrice, 
  onPressStart, 
  onPressEnd 
}: { 
  trade: IOpenTrade | IHistoricalTrade; 
  latestPrice?: number;
  onPressStart: (trade: IOpenTrade | IHistoricalTrade) => void;
  onPressEnd: () => void;
}) => {
  const isHistorical = 'soldPrice' in trade;
  
  const currentVal = isHistorical ? (trade as IHistoricalTrade).soldPrice : (latestPrice || trade.purchasePrice);
  const profitLoss = (currentVal - trade.purchasePrice) * trade.quantity;
  const profitLossPercent = ((currentVal - trade.purchasePrice) / trade.purchasePrice) * 100;
  const isProfit = profitLoss >= 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    onPressStart(trade);
  };

  const handleMouseDown = () => {
    onPressStart(trade);
  };

  return (
    <div 
      className="group relative bg-neutral-900 hover:bg-neutral-800 rounded-xl p-4 mb-3 border border-neutral-800 transition-all duration-200 active:scale-[0.98] select-none cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchEnd={onPressEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={onPressEnd}
      onMouseLeave={onPressEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isProfit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {isProfit ? <TrendingUpIcon /> : <TrendingDownIcon />}
          </div>
          <div>
            <h4 className="font-bold text-white text-lg">{trade.ticker}</h4>
            <span className="text-xs text-neutral-500 font-medium px-2 py-0.5 bg-neutral-800 rounded-md border border-neutral-700">
              {isHistorical ? 'CLOSED' : 'OPEN'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-mono font-bold text-lg ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {profitLoss > 0 ? '+' : ''}{formatCurrency(profitLoss)}
          </div>
          <div className={`text-xs font-medium ${isProfit ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
            {formatPercent(profitLossPercent)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-neutral-800/50">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">Entry Price</p>
          <p className="text-sm font-mono text-neutral-300">{formatCurrency(trade.purchasePrice)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">
            {isHistorical ? 'Exit Price' : 'Current Price'}
          </p>
          <p className="text-sm font-mono text-neutral-300">
            {latestPrice || isHistorical ? formatCurrency(currentVal) : <span className="animate-pulse">...</span>}
          </p>
        </div>
      </div>
      
      <div className="mt-3 flex items-center gap-1 text-xs text-neutral-600">
        <ClockIcon />
        <span>Opened {new Date(trade.openedTime).toLocaleDateString()}</span>
      </div>
      
      {/* Hint for interaction */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-neutral-800 text-[10px] text-neutral-400 px-2 py-1 rounded">Hold to view chart</div>
      </div>
    </div>
  );
};


export default function TradesClient() {
  const [openTrades, setOpenTrades] = useState<IOpenTrade[]>([]);
  const [historicalTrades, setHistoricalTrades] = useState<IHistoricalTrade[]>([]);
  const [systemConfig, setSystemConfig] = useState<ISystemConfig | null>(null);
  
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTrade, setActiveTrade] = useState<IOpenTrade | IHistoricalTrade | null>(null);
  const [activeDatapoints, setActiveDatapoints] = useState<ITradeDatapoint[]>([]);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadTrades() {
      try {
        const res = await fetch("/api/trades");
        if (!res.ok) throw new Error("Failed to fetch trades");
        const data = await res.json();
        
        setOpenTrades(data.openTrades);
        setHistoricalTrades(data.historicalTrades);
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


  const handlePressStart = (trade: IOpenTrade | IHistoricalTrade) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);

    pressTimer.current = setTimeout(() => {
      setActiveTrade(trade);
      setIsOverlayVisible(true);
      loadChartData(trade);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50); 
      }
    }, 200); 
  };

  const handlePressEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    setIsOverlayVisible(false);
  };

  const totalOpenPL = useMemo(() => {
    return openTrades.reduce((acc, trade) => {
      const current = currentPrices[trade.trade_id] || trade.purchasePrice;
      return acc + ((current - trade.purchasePrice) * trade.quantity);
    }, 0);
  }, [openTrades, currentPrices]);

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
    <div className="w-full max-w-md mx-auto min-h-screen pb-20 relative select-none">
      
      {/* Header / Summary Card */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-neutral-800 p-4 pt-12 pb-4 mb-4">
        <h1 className="text-sm font-medium text-neutral-400 mb-1">Total Portfolio Value</h1>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white tracking-tight">
            {formatCurrency(portfolioValue)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className={`text-sm font-medium px-1.5 py-0.5 rounded ${totalOpenPL >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {totalOpenPL >= 0 ? '+' : ''}{formatCurrency(totalOpenPL)}
          </span>
          <span className="text-xs text-neutral-500">Open P/L</span>
        </div>
      </div>

      <div className="px-4">
        {/* System Status Integration */}
        {systemConfig && <SystemStatus systemConfig={systemConfig} />}

        {/* Open Trades Section */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 ml-1">Open Positions</h2>
          {openTrades.length === 0 ? (
            <p className="text-neutral-600 text-sm italic ml-1">No open positions.</p>
          ) : (
            openTrades.map((trade) => (
              <TradeCard 
                key={trade.trade_id} 
                trade={trade} 
                latestPrice={currentPrices[trade.trade_id]}
                onPressStart={handlePressStart}
                onPressEnd={handlePressEnd}
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
              onPressStart={handlePressStart}
              onPressEnd={handlePressEnd}
            />
          ))}
        </div>
        
        <div className="text-center text-xs text-neutral-700 py-8 pb-24">
          <p>Press and hold any trade card to inspect performance.</p>
          <p className="mt-2">Platypus Dashboard v2.0</p>
        </div>
      </div>

      {/* Chart Overlay */}
      {activeTrade && (
        <QuickChartOverlay 
          trade={activeTrade} 
          datapoints={activeDatapoints} 
          visible={isOverlayVisible} 
        />
      )}
    </div>
  );
}