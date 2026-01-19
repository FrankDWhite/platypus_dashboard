"use client";
import { ILongTermPerformance } from "@/types/trade";

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

const formatPercent = (val: number) => {
  return `${val >= 0 ? '' : ''}${val.toFixed(2)}%`;
};

export default function LongTermPerformanceCard({
  performance,
}: {
  performance: ILongTermPerformance;
}) {
  return (
    <div className="w-full bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Historical Performance</span>
        </div>
        <div className="text-sm font-bold">
          <span className="text-neutral-400">Win Rate: </span>
          <span className={performance.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}>
            {performance.winRate.toFixed(2)}%
          </span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-neutral-800 flex justify-between items-start">
        <div>
          <p className="text-xs text-neutral-500 mb-1">Total Trades</p>
          <p className="text-xs font-mono text-neutral-300">
            {performance.totalTrades}
          </p>
          <p className="text-xs text-neutral-500 mb-1 mt-3">Average Contract Entry Price</p>
          <p className="text-xs font-mono text-neutral-300">
            {formatCurrency(performance.totalTrades > 0 ? performance.totalCapitalTraded / performance.totalTrades : 0)}
          </p>
        </div>
        <div className="text-right">
           <p className="text-xs text-neutral-500 mb-1">Total P/L (Assumes 1 Contract Traded)</p>
           <div className="flex flex-col items-end">
             <p className={`text-lg font-bold font-mono ${performance.totalPnlDollars >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               {performance.totalPnlDollars > 0 ? '' : ''}{formatCurrency(performance.totalPnlDollars)}
             </p>
             <p className={`text-xs font-medium ${performance.totalPnlPercent >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
               {formatPercent(performance.totalPnlPercent)}
             </p>
           </div>
        </div>
      </div>
    </div>
  );
}
