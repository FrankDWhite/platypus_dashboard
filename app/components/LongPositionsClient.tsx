"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  IChartPoint,
  ILongPositionV2,
  IPortfolioSummary,
  IPortfolioTransaction,
  IQuoteInfo,
} from "@/types/trade";

const ALLOCATION_COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
  "#f97316", // orange-500
];

const TrendingUpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const TrendingDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <polyline points="16 17 22 17 22 11" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

const formatPercent = (val: number) => {
  return `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`;
};

const formatShortDate = (dateInput?: string | Date | null) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getActionBadgeStyle = (action: string) => {
  switch (action) {
    case "BUY":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "ADD":
      return "bg-teal-500/15 text-teal-400 border-teal-500/30";
    case "TRIM":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "CLOSE":
      return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    case "DEPOSIT":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "WITHDRAW":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    default:
      return "bg-neutral-800 text-neutral-300 border-neutral-700";
  }
};

function PositionDetailModal({
  position,
  livePrice,
  spyLivePrice,
  portfolioNav,
  transactions,
  showDollars,
  onClose,
}: {
  position: ILongPositionV2;
  livePrice: number;
  spyLivePrice: number;
  portfolioNav: number;
  transactions: IPortfolioTransaction[];
  showDollars: boolean;
  onClose: () => void;
}) {
  const [chartPoints, setChartPoints] = useState<IChartPoint[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadChart() {
      setLoadingChart(true);
      try {
        const res = await fetch(
          `/api/quotes?chartSymbol=${encodeURIComponent(position.symbol)}&range=6mo`
        );
        if (res.ok && active) {
          const data = await res.json();
          setChartPoints(data.chart || []);
        }
      } catch (e) {
        console.error("Failed to load chart:", e);
      } finally {
        if (active) setLoadingChart(false);
      }
    }
    loadChart();
    return () => {
      active = false;
    };
  }, [position.symbol]);

  const isClosed = position.status === "CLOSED";
  const effectivePrice = isClosed
    ? position.averageExitPrice || position.averageCostBasis
    : livePrice;

  const unrealizedDollars = isClosed
    ? 0
    : (livePrice - position.averageCostBasis) * position.currentShares;
  const unrealizedPercent =
    !isClosed && position.averageCostBasis > 0
      ? ((livePrice - position.averageCostBasis) / position.averageCostBasis) * 100
      : 0;

  const primaryPercent = isClosed ? position.realizedPnlPercent : unrealizedPercent;
  const isProfit = primaryPercent >= 0;
  const chartColor = isProfit ? "#10b981" : "#f43f5e";

  const currentMarketValue = position.currentShares * livePrice;
  const weightPercent =
    !isClosed && portfolioNav > 0 ? (currentMarketValue / portfolioNav) * 100 : 0;

  const spyReturnDuringHold =
    position.benchmarkCostBasisSpy && position.benchmarkCostBasisSpy > 0 && spyLivePrice > 0
      ? ((spyLivePrice - position.benchmarkCostBasisSpy) /
          position.benchmarkCostBasisSpy) *
        100
      : null;

  const posAlphaVsSpy =
    spyReturnDuringHold !== null ? primaryPercent - spyReturnDuringHold : null;

  const posTransactions = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          t.position_id === position.position_id ||
          (!t.position_id && t.symbol === position.symbol)
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, position]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col overflow-hidden">
      {/* Modal Top Bar */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          <ChevronLeftIcon />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-bold text-white tracking-wide text-lg">
            {position.symbol}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              isClosed
                ? "border-neutral-700 text-neutral-400 bg-neutral-900"
                : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
            }`}
          >
            {position.status}
          </span>
        </div>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto pb-24 max-w-2xl mx-auto w-full">
        {/* Price & Return Hero */}
        <div className="pt-6 pb-3 px-6 text-center">
          <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
            {isClosed ? "Average Exit Price" : "Current Market Price"}
          </p>
          <h1 className="text-4xl font-bold font-mono text-white tracking-tight mb-2">
            {formatCurrency(effectivePrice)}
          </h1>
          <div
            className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full ${
              isProfit
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-rose-500/15 text-rose-400"
            }`}
          >
            {isProfit ? <TrendingUpIcon /> : <TrendingDownIcon />}
            <span>
              {showDollars &&
                `${formatCurrency(
                  isClosed ? position.realizedPnlDollars : unrealizedDollars
                )} · `}
              {formatPercent(primaryPercent)}{" "}
              {isClosed ? "Realized" : "Unrealized"}
            </span>
          </div>

          {posAlphaVsSpy !== null && !isClosed && (
            <p className="text-xs text-neutral-400 mt-2">
              S&amp;P 500 over same period:{" "}
              <span className="font-mono text-neutral-300">
                {formatPercent(spyReturnDuringHold!)}
              </span>{" "}
              (
              <span
                className={`font-mono font-semibold ${
                  posAlphaVsSpy >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatPercent(posAlphaVsSpy)} Alpha
              </span>
              )
            </p>
          )}
        </div>

        {/* 6M Price Chart with Cost Basis Reference Line */}
        <div className="h-64 w-full my-2 px-2">
          {loadingChart ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-600 gap-2">
              <div className="w-7 h-7 border-2 border-neutral-800 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-xs">Loading {position.symbol} chart...</span>
            </div>
          ) : chartPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartPoints}
                margin={{ top: 16, right: 12, left: 12, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id={`grad-${position.symbol}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#262626"
                  vertical={false}
                />
                <XAxis dataKey="timestamp" hide />
                <YAxis domain={["auto", "auto"]} hide />
                <Tooltip
                  cursor={{
                    stroke: "#525252",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  contentStyle={{
                    backgroundColor: "#171717",
                    borderColor: "#262626",
                    color: "#fff",
                    borderRadius: "10px",
                    padding: "8px 12px",
                  }}
                  labelFormatter={(val) => formatShortDate(val)}
                  formatter={(value: unknown) => [
                    typeof value === "number" ? formatCurrency(value) : "N/A",
                    "Close",
                  ]}
                />
                <ReferenceLine
                  y={position.averageCostBasis}
                  stroke="#a3a3a3"
                  strokeDasharray="4 4"
                  label={{
                    position: "insideTopRight",
                    value: `Avg Cost ${formatCurrency(position.averageCostBasis)}`,
                    fill: "#a3a3a3",
                    fontSize: 11,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#grad-${position.symbol})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-600 text-xs">
              Chart data unavailable
            </div>
          )}
        </div>

        {/* Position Stats Grid */}
        <div className="px-4 mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-800">
              <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">
                Average Cost Basis
              </p>
              <p className="text-base font-mono font-bold text-white">
                {formatCurrency(position.averageCostBasis)}
              </p>
            </div>

            {!isClosed ? (
              <div className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-800">
                <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">
                  Portfolio Weight
                </p>
                <p className="text-base font-mono font-bold text-emerald-400">
                  {weightPercent.toFixed(2)}%
                </p>
              </div>
            ) : (
              <div className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-800">
                <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">
                  Average Exit Price
                </p>
                <p className="text-base font-mono font-bold text-white">
                  {formatCurrency(position.averageExitPrice || 0)}
                </p>
              </div>
            )}

            {showDollars && !isClosed && (
              <>
                <div className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-800">
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">
                    Current Value / Shares
                  </p>
                  <p className="text-base font-mono font-bold text-white">
                    {formatCurrency(currentMarketValue)}{" "}
                    <span className="text-xs text-neutral-400 font-normal">
                      ({position.currentShares} sh)
                    </span>
                  </p>
                </div>
                <div className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-800">
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">
                    Active Cost Basis
                  </p>
                  <p className="text-base font-mono text-neutral-300">
                    {formatCurrency(position.totalCostBasis)}
                  </p>
                </div>
              </>
            )}

            {position.totalSharesSold > 0 && (
              <div className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-800 col-span-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-0.5">
                      Realized from Trims / Sales
                    </p>
                    <p className="text-xs text-neutral-400">
                      {showDollars
                        ? `${position.totalSharesSold} of ${position.totalSharesBought} total shares sold`
                        : `${(
                            (position.totalSharesSold /
                              Math.max(1, position.totalSharesBought)) *
                            100
                          ).toFixed(0)}% of total shares trimmed/exited`}{" "}
                      @ avg {formatCurrency(position.averageExitPrice || 0)}
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <div
                      className={`text-sm font-bold ${
                        position.realizedPnlDollars >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {showDollars &&
                        `${
                          position.realizedPnlDollars >= 0 ? "+" : ""
                        }${formatCurrency(position.realizedPnlDollars)} · `}
                      {formatPercent(position.realizedPnlPercent)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {position.notes && (
            <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">
                Investment Thesis / Notes
              </p>
              <p className="text-sm text-neutral-300 leading-relaxed">
                {position.notes}
              </p>
            </div>
          )}

          {/* Action Timeline (Buys, Adds, Trims, Closes) */}
          <div className="pt-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
              Position Action Timeline ({posTransactions.length})
            </h3>
            <div className="space-y-2.5">
              {posTransactions.map((tx) => {
                const isSell = tx.action === "TRIM" || tx.action === "CLOSE";
                return (
                  <div
                    key={tx.transaction_id}
                    className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getActionBadgeStyle(
                            tx.action
                          )}`}
                        >
                          {tx.action}
                        </span>
                        <span className="text-sm font-mono font-semibold text-white">
                          @ {formatCurrency(tx.price || 0)}
                        </span>
                        {showDollars && tx.shares && (
                          <span className="text-xs text-neutral-400 font-mono">
                            ({tx.shares} sh · {formatCurrency(tx.amount)})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-2">
                        <span>{formatShortDate(tx.date)}</span>
                        {tx.spyPriceAtDate && (
                          <span>· SPY @ {formatCurrency(tx.spyPriceAtDate)}</span>
                        )}
                      </div>
                      {tx.notes && (
                        <p className="text-xs text-neutral-400 mt-1.5 italic">
                          &ldquo;{tx.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {isSell &&
                      tx.realizedPnlPercent !== null &&
                      tx.realizedPnlPercent !== undefined && (
                        <div className="text-right font-mono">
                          <div
                            className={`text-sm font-bold ${
                              (tx.realizedPnlDollars || 0) >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {formatPercent(tx.realizedPnlPercent)}
                          </div>
                          {showDollars && tx.realizedPnlDollars !== undefined && (
                            <div className="text-[11px] text-neutral-400">
                              {(tx.realizedPnlDollars || 0) >= 0 ? "+" : ""}
                              {formatCurrency(tx.realizedPnlDollars || 0)}
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LongPositionsClient() {
  const [positions, setPositions] = useState<ILongPositionV2[]>([]);
  const [transactions, setTransactions] = useState<IPortfolioTransaction[]>([]);
  const [summary, setSummary] = useState<IPortfolioSummary | null>(null);
  const [quotes, setQuotes] = useState<Record<string, IQuoteInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toggle between "% Only" (false) and "$ + %" (true)
  const [showDollars, setShowDollars] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"OPEN" | "CLOSED" | "LEDGER">(
    "OPEN"
  );
  const [selectedPosition, setSelectedPosition] =
    useState<ILongPositionV2 | null>(null);

  useEffect(() => {
    async function loadPortfolioAndQuotes() {
      try {
        const res = await fetch("/api/long-positions");
        if (!res.ok) throw new Error("Failed to fetch portfolio data");
        const data = await res.json();

        const loadedPositions: ILongPositionV2[] = data.positions || [];
        const loadedTransactions: IPortfolioTransaction[] =
          data.transactions || [];
        const loadedSummary: IPortfolioSummary = data.summary;

        setPositions(loadedPositions);
        setTransactions(loadedTransactions);
        setSummary(loadedSummary);

        // Fetch live quotes for open symbols + SPY
        const openSymbols = loadedPositions
          .filter((p) => p.status === "OPEN")
          .map((p) => p.symbol);
        const querySymbols = Array.from(new Set([...openSymbols, "SPY"])).join(
          ","
        );

        const quoteRes = await fetch(
          `/api/quotes?symbols=${encodeURIComponent(querySymbols)}`
        );
        if (quoteRes.ok) {
          const quoteData = await quoteRes.json();
          setQuotes(quoteData.quotes || {});
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load portfolio");
      } finally {
        setLoading(false);
      }
    }
    loadPortfolioAndQuotes();
  }, []);

  const getLivePrice = (pos: ILongPositionV2): number => {
    return (
      quotes[pos.symbol]?.price ?? pos.lastKnownPrice ?? pos.averageCostBasis
    );
  };

  const spyLivePrice = useMemo(() => {
    return (
      quotes["SPY"]?.price ??
      summary?.lastKnownSpyPrice ??
      summary?.benchmarkAvgCostSpy ??
      0
    );
  }, [quotes, summary]);

  const openPositions = useMemo(() => {
    return positions.filter((p) => p.status === "OPEN");
  }, [positions]);

  const closedPositions = useMemo(() => {
    return positions.filter((p) => p.status === "CLOSED");
  }, [positions]);

  // Portfolio-wide calculations (including Cash)
  const metrics = useMemo(() => {
    const cashBalance = summary?.cashBalance ?? 0;
    let openEquityValue = 0;
    let openEquityCost = 0;

    for (const pos of openPositions) {
      const price =
        quotes[pos.symbol]?.price ?? pos.lastKnownPrice ?? pos.averageCostBasis;
      openEquityValue += pos.currentShares * price;
      openEquityCost += pos.totalCostBasis;
    }

    const totalNav = openEquityValue + cashBalance;
    const totalRealized = summary?.totalRealizedPnlDollars ?? 0;
    const openUnrealizedDollars = openEquityValue - openEquityCost;
    const openUnrealizedPercent =
      openEquityCost > 0 ? (openUnrealizedDollars / openEquityCost) * 100 : 0;

    // Net capital deposited (fallback to openEquityCost + cashBalance if not set)
    const netDeposited =
      summary && summary.totalNetDeposited > 0
        ? summary.totalNetDeposited
        : openEquityCost + cashBalance;

    const totalPortfolioPnlDollars = totalNav - netDeposited;
    const totalPortfolioReturnPct =
      netDeposited > 0 ? (totalPortfolioPnlDollars / netDeposited) * 100 : 0;

    // 1. Cash-Flow Matched Benchmark (S&P 500 SPY on exact deposit dates)
    const spyShares = summary?.benchmarkSpyShares ?? 0;
    const benchmarkNav =
      spyShares > 0 && spyLivePrice > 0 ? spyShares * spyLivePrice : netDeposited;
    const benchmarkReturnDollars = benchmarkNav - netDeposited;
    const benchmarkReturnPct =
      netDeposited > 0 && spyShares > 0
        ? (benchmarkReturnDollars / netDeposited) * 100
        : 0;

    const alphaPct = totalPortfolioReturnPct - benchmarkReturnPct;

    // 2. Standard Buy-and-Hold S&P 500 YTD (from Dec 31 close)
    const spyYtdStartPrice = quotes["SPY"]?.ytdStartPrice ?? 681.92;
    const spyYtdReturnPct =
      quotes["SPY"]?.ytdChangePercent ??
      (spyLivePrice > 0 && spyYtdStartPrice > 0
        ? ((spyLivePrice - spyYtdStartPrice) / spyYtdStartPrice) * 100
        : 0);
    const alphaVsYtdPct = totalPortfolioReturnPct - spyYtdReturnPct;

    const cashWeightPct = totalNav > 0 ? (cashBalance / totalNav) * 100 : 0;
    const equityWeightPct = totalNav > 0 ? (openEquityValue / totalNav) * 100 : 0;

    return {
      cashBalance,
      openEquityValue,
      openEquityCost,
      totalNav,
      netDeposited,
      totalRealized,
      openUnrealizedDollars,
      openUnrealizedPercent,
      totalPortfolioPnlDollars,
      totalPortfolioReturnPct,
      benchmarkNav,
      benchmarkReturnDollars,
      benchmarkReturnPct,
      alphaPct,
      spyYtdReturnPct,
      alphaVsYtdPct,
      cashWeightPct,
      equityWeightPct,
    };
  }, [openPositions, quotes, summary, spyLivePrice]);

  // Sort open positions by portfolio weight descending
  const sortedOpenPositions = useMemo(() => {
    return [...openPositions].sort((a, b) => {
      const valA = a.currentShares * getLivePrice(a);
      const valB = b.currentShares * getLivePrice(b);
      return valB - valA;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPositions, quotes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-neutral-800 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-neutral-500 animate-pulse text-sm">
            Loading Long Portfolio &amp; Market Quotes...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-rose-500 bg-black min-h-screen">
        Error: {error}
      </div>
    );
  }

  const isPortProfit = metrics.totalPortfolioReturnPct >= 0;
  const isAlphaPositive = metrics.alphaPct >= 0;

  return (
    <div className="w-full max-w-2xl mx-auto min-h-screen pb-24 relative select-none bg-black text-white">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-30 bg-black/85 backdrop-blur-md border-b border-neutral-800 px-5 pt-10 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Platypus Capital · Long Portfolio
            </h1>
            {summary?.inceptionDate && (
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Track Record Since {formatShortDate(summary.inceptionDate)}
              </p>
            )}
          </div>

          {/* Toggle between "% Only" and "$ + %" */}
          <div className="flex items-center bg-neutral-900 p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => setShowDollars(false)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                !showDollars
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              % Only
            </button>
            <button
              onClick={() => setShowDollars(true)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                showDollars
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              $ + %
            </button>
          </div>
        </div>

        {/* Hero Return & Benchmark Comparison */}
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">
              {showDollars
                ? "Total Portfolio Value (Incl. Cash)"
                : "Total Portfolio Return (Incl. Cash)"}
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold font-mono tracking-tight text-white">
                {showDollars
                  ? formatCurrency(metrics.totalNav)
                  : formatPercent(metrics.totalPortfolioReturnPct)}
              </span>
              {showDollars && (
                <span
                  className={`text-sm font-mono font-bold px-2 py-0.5 rounded-md ${
                    isPortProfit
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/20 text-rose-400"
                  }`}
                >
                  {metrics.totalPortfolioPnlDollars >= 0 ? "+" : ""}
                  {formatCurrency(metrics.totalPortfolioPnlDollars)} (
                  {formatPercent(metrics.totalPortfolioReturnPct)})
                </span>
              )}
            </div>
          </div>

          {/* Benchmark (S&P 500) Comparison Box */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                vs. S&amp;P 500 (Cash-Flow Matched)
              </span>
              <span
                className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                  isAlphaPositive
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/20 text-rose-400"
                }`}
              >
                {formatPercent(metrics.alphaPct)} Alpha
              </span>
            </div>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              Matched SPY:{" "}
              <span className="text-neutral-200 font-semibold">
                {formatPercent(metrics.benchmarkReturnPct)}
              </span>
              {showDollars && ` (${formatCurrency(metrics.benchmarkNav)})`}
            </p>
            <div className="mt-1.5 pt-1.5 border-t border-neutral-800/80 flex items-center justify-end gap-2 text-[11px] font-mono text-neutral-400">
              <span>
                SPY Buy &amp; Hold YTD:{" "}
                <span className="text-neutral-300 font-semibold">
                  {formatPercent(metrics.spyYtdReturnPct)}
                </span>
              </span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  metrics.alphaVsYtdPct >= 0
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-rose-500/15 text-rose-400"
                }`}
              >
                {formatPercent(metrics.alphaVsYtdPct)}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-metrics Row: Active Equity Return, Realized Gains, Cash Split */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80 grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase">
              Active Equity Return
            </span>
            <span
              className={`font-mono font-semibold ${
                metrics.openUnrealizedPercent >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {formatPercent(metrics.openUnrealizedPercent)}
              {showDollars &&
                ` (${
                  metrics.openUnrealizedDollars >= 0 ? "+" : ""
                }${formatCurrency(metrics.openUnrealizedDollars)})`}
            </span>
          </div>

          <div>
            <span className="text-neutral-500 block text-[10px] uppercase">
              Equity / Cash Split
            </span>
            <span className="font-mono text-neutral-200 font-semibold">
              {metrics.equityWeightPct.toFixed(1)}% /{" "}
              {metrics.cashWeightPct.toFixed(1)}%
            </span>
          </div>

          <div className="text-right">
            <span className="text-neutral-500 block text-[10px] uppercase">
              Realized Gains
            </span>
            <span
              className={`font-mono font-semibold ${
                metrics.totalRealized >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {showDollars
                ? `${metrics.totalRealized >= 0 ? "+" : ""}${formatCurrency(
                    metrics.totalRealized
                  )}`
                : metrics.netDeposited > 0
                ? `${formatPercent(
                    (metrics.totalRealized / metrics.netDeposited) * 100
                  )} of Port`
                : "0.00%"}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5">
        {/* Portfolio Allocation Bar */}
        {metrics.totalNav > 0 && (
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2.5">
              <h2 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                Portfolio Weight Allocation
              </h2>
              <span className="text-[11px] font-mono text-neutral-500">
                100% Total Pile
              </span>
            </div>

            {/* Stacked Progress Bar */}
            <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden flex">
              {sortedOpenPositions.map((pos, idx) => {
                const val = pos.currentShares * getLivePrice(pos);
                const pct =
                  metrics.totalNav > 0 ? (val / metrics.totalNav) * 100 : 0;
                if (pct <= 0) return null;
                return (
                  <div
                    key={pos.position_id}
                    style={{
                      width: `${pct}%`,
                      backgroundColor:
                        ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length],
                    }}
                    className="h-full transition-all duration-300 first:rounded-l-full"
                    title={`${pos.symbol}: ${pct.toFixed(1)}%`}
                  />
                );
              })}
              {metrics.cashWeightPct > 0 && (
                <div
                  style={{ width: `${metrics.cashWeightPct}%` }}
                  className="h-full bg-neutral-600 transition-all duration-300"
                  title={`CASH: ${metrics.cashWeightPct.toFixed(1)}%`}
                />
              )}
            </div>

            {/* Allocation Legend Chips */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
              {sortedOpenPositions.map((pos, idx) => {
                const val = pos.currentShares * getLivePrice(pos);
                const pct =
                  metrics.totalNav > 0 ? (val / metrics.totalNav) * 100 : 0;
                return (
                  <div
                    key={pos.position_id}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-sm inline-block"
                      style={{
                        backgroundColor:
                          ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length],
                      }}
                    />
                    <span className="font-semibold text-neutral-200">
                      {pos.symbol}
                    </span>
                    <span className="font-mono text-neutral-400">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
              {metrics.cashBalance > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block bg-neutral-600" />
                  <span className="font-semibold text-neutral-300">CASH</span>
                  <span className="font-mono text-neutral-400">
                    {metrics.cashWeightPct.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex border-b border-neutral-800 mb-5 gap-6">
          <button
            onClick={() => setActiveTab("OPEN")}
            className={`pb-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === "OPEN"
                ? "border-emerald-500 text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Open Holdings ({sortedOpenPositions.length})
          </button>
          <button
            onClick={() => setActiveTab("CLOSED")}
            className={`pb-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === "CLOSED"
                ? "border-emerald-500 text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Closed Campaigns ({closedPositions.length})
          </button>
          <button
            onClick={() => setActiveTab("LEDGER")}
            className={`pb-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === "LEDGER"
                ? "border-emerald-500 text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Action Ledger ({transactions.length})
          </button>
        </div>

        {/* TAB 1: OPEN HOLDINGS */}
        {activeTab === "OPEN" && (
          <div className="space-y-3">
            {sortedOpenPositions.length === 0 && metrics.cashBalance <= 0 && (
              <p className="text-neutral-500 text-sm italic py-6 text-center">
                No open holdings yet. Run{" "}
                <code className="text-emerald-400">./manage_portfolio.py</code>{" "}
                to log positions and cash.
              </p>
            )}

            {sortedOpenPositions.map((pos) => {
              const livePrice = getLivePrice(pos);
              const currentVal = pos.currentShares * livePrice;
              const unrealizedDlr = currentVal - pos.totalCostBasis;
              const unrealizedPct =
                pos.totalCostBasis > 0
                  ? (unrealizedDlr / pos.totalCostBasis) * 100
                  : 0;
              const isProfit = unrealizedPct >= 0;
              const weightPct =
                metrics.totalNav > 0 ? (currentVal / metrics.totalNav) * 100 : 0;
              const hasTrimmed = pos.totalSharesSold > 0;

              const spyReturnDuringHold =
                pos.benchmarkCostBasisSpy &&
                pos.benchmarkCostBasisSpy > 0 &&
                spyLivePrice > 0
                  ? ((spyLivePrice - pos.benchmarkCostBasisSpy) /
                      pos.benchmarkCostBasisSpy) *
                    100
                  : null;
              const vsSpyAlpha =
                spyReturnDuringHold !== null
                  ? unrealizedPct - spyReturnDuringHold
                  : null;

              return (
                <div
                  key={pos.position_id}
                  onClick={() => setSelectedPosition(pos)}
                  className="bg-neutral-900 hover:bg-neutral-800/80 rounded-xl p-5 border border-neutral-800 transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          isProfit
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {isProfit ? <TrendingUpIcon /> : <TrendingDownIcon />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-xl tracking-tight">
                            {pos.symbol}
                          </h4>
                          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                            {weightPct.toFixed(1)}% wt
                          </span>
                          {hasTrimmed && (
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Trimmed ({formatPercent(pos.realizedPnlPercent)}{" "}
                              locked)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500">
                          {showDollars && (
                            <span>{pos.currentShares} shares ·</span>
                          )}
                          <span>Since {formatShortDate(pos.openedDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div
                        className={`font-bold text-lg ${
                          isProfit ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {showDollars
                          ? `${unrealizedDlr >= 0 ? "+" : ""}${formatCurrency(
                              unrealizedDlr
                            )}`
                          : formatPercent(unrealizedPct)}
                      </div>
                      <div
                        className={`text-xs font-medium mt-0.5 ${
                          showDollars
                            ? isProfit
                              ? "text-emerald-500/90"
                              : "text-rose-500/90"
                            : vsSpyAlpha !== null
                            ? vsSpyAlpha >= 0
                              ? "text-emerald-500/90"
                              : "text-rose-500/90"
                            : isProfit
                            ? "text-emerald-500/90"
                            : "text-rose-500/90"
                        }`}
                      >
                        {showDollars
                          ? formatPercent(unrealizedPct)
                          : vsSpyAlpha !== null
                          ? `${formatPercent(vsSpyAlpha)} vs SPY`
                          : "Unrealized"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-800/60 text-xs">
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">
                        Live Price{" "}
                        {showDollars && " / Market Value"}
                      </p>
                      <p className="font-mono text-neutral-200">
                        {formatCurrency(livePrice)}
                        {showDollars && (
                          <span className="text-neutral-400">
                            {" "}
                            · {formatCurrency(currentVal)}
                          </span>
                        )}
                      </p>
                    </div>

                    {vsSpyAlpha !== null && showDollars && (
                      <div className="text-center">
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">
                          vs. S&amp;P 500
                        </p>
                        <p
                          className={`font-mono font-semibold ${
                            vsSpyAlpha >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {formatPercent(vsSpyAlpha)}
                        </p>
                      </div>
                    )}

                    <div className="text-right">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">
                        Avg Cost Basis
                      </p>
                      <p className="font-mono text-neutral-300">
                        {formatCurrency(pos.averageCostBasis)}
                        {showDollars && (
                          <span className="text-neutral-500">
                            {" "}
                            ({formatCurrency(pos.totalCostBasis)})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Cash / Dry Powder Card */}
            {metrics.cashBalance > 0 && (
              <div className="bg-neutral-900/60 rounded-xl p-5 border border-neutral-800/80 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-mono font-bold text-sm">
                    $$
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-neutral-200 text-base">
                        CASH (Dry Powder)
                      </h4>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {metrics.cashWeightPct.toFixed(1)}% wt
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Uninvested capital ready for deployment
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-base font-bold text-neutral-200">
                    {showDollars
                      ? formatCurrency(metrics.cashBalance)
                      : `${metrics.cashWeightPct.toFixed(2)}% of Port`}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CLOSED CAMPAIGNS */}
        {activeTab === "CLOSED" && (
          <div className="space-y-3">
            {closedPositions.length === 0 ? (
              <p className="text-neutral-500 text-sm italic py-6 text-center">
                No closed position campaigns yet.
              </p>
            ) : (
              closedPositions.map((pos) => {
                const isProfit = pos.realizedPnlPercent >= 0;
                return (
                  <div
                    key={pos.position_id}
                    onClick={() => setSelectedPosition(pos)}
                    className="bg-neutral-900 hover:bg-neutral-800/80 rounded-xl p-5 border border-neutral-800 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-xl">
                            {pos.symbol}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-neutral-700 text-neutral-400">
                            CLOSED
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          {formatShortDate(pos.openedDate)} &rarr;{" "}
                          {formatShortDate(pos.closedDate)}
                        </p>
                      </div>

                      <div className="text-right font-mono">
                        <div
                          className={`font-bold text-lg ${
                            isProfit ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {showDollars
                            ? `${
                                pos.realizedPnlDollars >= 0 ? "+" : ""
                              }${formatCurrency(pos.realizedPnlDollars)}`
                            : formatPercent(pos.realizedPnlPercent)}
                        </div>
                        {showDollars && (
                          <div
                            className={`text-xs ${
                              isProfit
                                ? "text-emerald-500/80"
                                : "text-rose-500/80"
                            }`}
                          >
                            {formatPercent(pos.realizedPnlPercent)} Realized
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between pt-3 border-t border-neutral-800/60 text-xs font-mono">
                      <div>
                        <span className="text-neutral-500 block text-[10px] uppercase font-sans">
                          Avg Entry
                        </span>
                        <span className="text-neutral-300">
                          {formatCurrency(pos.averageCostBasis)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-neutral-500 block text-[10px] uppercase font-sans">
                          Avg Exit
                        </span>
                        <span className="text-neutral-200">
                          {formatCurrency(pos.averageExitPrice || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: ACTION LEDGER */}
        {activeTab === "LEDGER" && (
          <div className="space-y-2.5">
            {transactions.length === 0 ? (
              <p className="text-neutral-500 text-sm italic py-6 text-center">
                No transactions logged yet.
              </p>
            ) : (
              transactions.map((tx) => {
                const isCashAction = tx.symbol === "CASH";
                const isSell = tx.action === "TRIM" || tx.action === "CLOSE";
                return (
                  <div
                    key={tx.transaction_id}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getActionBadgeStyle(
                            tx.action
                          )}`}
                        >
                          {tx.action}
                        </span>
                        <span className="font-bold text-white text-sm">
                          {tx.symbol}
                        </span>
                        {!isCashAction && tx.price && (
                          <span className="text-xs font-mono text-neutral-300">
                            @ {formatCurrency(tx.price)}
                          </span>
                        )}
                        {showDollars && !isCashAction && tx.shares && (
                          <span className="text-xs font-mono text-neutral-500">
                            ({tx.shares} sh)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-1">
                        {formatShortDate(tx.date)}
                        {tx.spyPriceAtDate &&
                          ` · SPY Ref: ${formatCurrency(tx.spyPriceAtDate)}`}
                      </div>
                      {tx.notes && (
                        <p className="text-xs text-neutral-400 mt-1 italic">
                          &ldquo;{tx.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="text-right font-mono">
                      {isSell &&
                      tx.realizedPnlPercent !== null &&
                      tx.realizedPnlPercent !== undefined ? (
                        <>
                          <div
                            className={`text-sm font-bold ${
                              (tx.realizedPnlDollars || 0) >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {formatPercent(tx.realizedPnlPercent)}
                          </div>
                          {showDollars && (
                            <div className="text-xs text-neutral-400">
                              {(tx.realizedPnlDollars || 0) >= 0 ? "+" : ""}
                              {formatCurrency(tx.realizedPnlDollars || 0)}
                            </div>
                          )}
                        </>
                      ) : (
                        showDollars && (
                          <div className="text-sm text-neutral-300">
                            {formatCurrency(tx.amount)}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        <div className="text-center text-xs text-neutral-600 py-10">
          <p>Tap any position to inspect buys, trims, and benchmark chart.</p>
          <p className="mt-1 text-neutral-700">Platypus Long Dashboard v3.0</p>
        </div>
      </div>

      {/* Position Detail Modal */}
      {selectedPosition && (
        <PositionDetailModal
          position={selectedPosition}
          livePrice={getLivePrice(selectedPosition)}
          spyLivePrice={spyLivePrice}
          portfolioNav={metrics.totalNav}
          transactions={transactions}
          showDollars={showDollars}
          onClose={() => setSelectedPosition(null)}
        />
      )}
    </div>
  );
}
