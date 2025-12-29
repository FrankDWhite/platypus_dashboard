"use client";

import { useState, useEffect, useMemo } from "react";
import { ILongPosition } from "@/types/trade";
import Link from "next/link";

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

const LongPositionCard = ({ 
  position 
}: { 
  position: ILongPosition; 
}) => {
  const isProfit = position.percentChange >= 0;
  const totalCost = position.costBasis * position.quantity;
  const profitLossDollars = position.totalValue - totalCost;

  return (
    <div 
      className="bg-neutral-900 hover:bg-neutral-800/80 rounded-xl p-5 mb-3 border border-neutral-800 transition-all duration-200 shadow-sm"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isProfit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {isProfit ? <TrendingUpIcon /> : <TrendingDownIcon />}
          </div>
          <div>
            <h4 className="font-bold text-white text-xl tracking-tight">{position.symbol}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-neutral-500">{position.quantity} shares</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-mono font-bold text-lg ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {profitLossDollars > 0 ? '+' : ''}{formatCurrency(profitLossDollars)}
          </div>
          <div className={`text-xs font-medium mt-0.5 ${isProfit ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
            {formatPercent(position.percentChange)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-neutral-800/50">
        <div>
           <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">Current Value</p>
           <p className="text-sm font-mono text-neutral-200">
             {formatCurrency(position.totalValue)}
           </p>
        </div>
        <div className="text-right">
           <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">Cost Basis</p>
           <p className="text-sm font-mono text-neutral-400">{formatCurrency(position.costBasis)}</p>
        </div>
      </div>
    </div>
  );
};


export default function LongPositionsClient() {
  const [positions, setPositions] = useState<ILongPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPositions() {
      try {
        const res = await fetch("/api/long-positions");
        if (!res.ok) throw new Error("Failed to fetch long positions");
        const data = await res.json();
        setPositions(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    loadPositions();
  }, []);

  const totalValue = useMemo(() => {
    return positions.reduce((acc, pos) => acc + pos.totalValue, 0);
  }, [positions]);

  const totalCostBasis = useMemo(() => {
    return positions.reduce((acc, pos) => acc + pos.costBasis, 0);
  }, [positions]);
  
  const totalPL = totalValue - totalCostBasis;
  const totalPLPercent = totalCostBasis > 0 ? (totalPL / totalCostBasis) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-neutral-800 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-neutral-500 animate-pulse text-sm">Loading Long Positions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-rose-500">Error: {error}</div>;
  }

  return (
    <div className="w-full max-w-xl mx-auto min-h-screen pb-20 relative select-none bg-black">
      
      {/* Header / Summary Card */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-neutral-800 p-5 pt-12 pb-5 mb-4">
        <div className="flex items-center mb-4">
          <Link href="/" className="p-2 -ml-2 mr-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-lg font-bold text-white">Long Positions</h1>
        </div>
        
        <h1 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">Total Long Equity</h1>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-white tracking-tight">
            {formatCurrency(totalValue)}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${totalPL >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {totalPL >= 0 ? '+' : ''}{formatCurrency(totalPL)}
          </span>
          <span className={`text-xs font-medium ${totalPL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
             ({formatPercent(totalPLPercent)})
          </span>
          <span className="text-xs text-neutral-500 font-medium ml-1">Total Return</span>
        </div>
      </div>

      <div className="px-3 md:px-4">
        {/* Positions Section */}
        <div className="mb-8 mt-6">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 ml-1">Holdings</h2>
          {positions.length === 0 ? (
            <p className="text-neutral-600 text-sm italic ml-1">No long positions found.</p>
          ) : (
            positions.map((pos, idx) => (
              <LongPositionCard 
                key={idx} // No ID in interface, use index or symbol
                position={pos} 
              />
            ))
          )}
        </div>
        
        <div className="text-center text-xs text-neutral-800 py-8 pb-24">
          <p>Platypus Dashboard v2.1</p>
        </div>
      </div>
    </div>
  );
}
