"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  IOpenTrade,
  IHistoricalTrade,
  ITradeDatapoint,
  ISystemConfig,
} from "@/types/trade";
import SystemStatus from "./SystemStatus";

async function fetchTrades() {
  const res = await fetch("/api/trades");
  if (!res.ok) {
    throw new Error("Failed to fetch trades");
  }
  return res.json();
}

async function fetchDatapoints(trade_id: string) {
  const res = await fetch(`/api/datapoints/${trade_id}`);
  if (!res.ok) {
    return []; // Return empty array if no datapoints found
  }
  return res.json();
}

export default function TradesClient() {
  const [openTrades, setOpenTrades] = useState<IOpenTrade[]>([]);
  const [historicalTrades, setHistoricalTrades] = useState<IHistoricalTrade[]>(
    []
  );
  const [
    selectedTradeDatapoints,
    setSelectedTradeDatapoints,
  ] = useState<ITradeDatapoint[]>([]);
  const [systemConfig, setSystemConfig] = useState<ISystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrades() {
      try {
        const { openTrades, historicalTrades, systemConfig } = await fetchTrades();
        setOpenTrades(openTrades);
        setHistoricalTrades(historicalTrades);
        setSystemConfig(systemConfig);
      } catch (e) {
        setError("Failed to load trades.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadTrades();
  }, []);

  const handleTradeSelect = async (trade_id: string) => {
    try {
      const datapoints = await fetchDatapoints(trade_id);
      setSelectedTradeDatapoints(datapoints);
    } catch (e) {
      setError("Failed to load datapoints.");
      console.error(e);
    }
  };

  if (loading) {
    return <div className="text-center text-white">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-white mb-6">Trade Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Open Trades</h2>
          <ul className="space-y-2">
            {openTrades.map((trade) => (
              <li
                key={trade.trade_id}
                className="p-2 rounded-md bg-gray-700 cursor-pointer hover:bg-gray-600"
                onClick={() => handleTradeSelect(trade.trade_id)}
              >
                <p className="text-white">{trade.ticker}</p>
                <p className="text-sm text-gray-400">
                  {trade.quantity} @ {trade.purchasePrice}
                </p>
                <p className="text-sm text-gray-400">{trade.description}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">
            Historical Trades
          </h2>
          <ul className="space-y-2">
            {historicalTrades.map((trade) => (
              <li
                key={trade.trade_id}
                className="p-2 rounded-md bg-gray-700 cursor-pointer hover:bg-gray-600"
                onClick={() => handleTradeSelect(trade.trade_id)}
              >
                <p className="text-white">{trade.ticker}</p>
                <p className="text-sm text-gray-400">
                  {trade.quantity} @ {trade.purchasePrice}
                </p>
                <p className="text-sm text-gray-400">{trade.description}</p>
              </li>
            ))}
          </ul>
        </div>
        {systemConfig && <SystemStatus systemConfig={systemConfig} />}
      </div>

      {selectedTradeDatapoints.length > 0 && (
        <div className="mt-6 bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">
              Trade Performance
            </h2>
            <p className="text-sm text-gray-400">
              Press and hold to see details
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={selectedTradeDatapoints}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(time) => new Date(time).toLocaleDateString()}
                stroke="#a0aec0"
              />
              <YAxis stroke="#a0aec0" />
              <Tooltip
                contentStyle={{ backgroundColor: "#2d3748", border: "none" }}
                labelStyle={{ color: "#a0aec0" }}
              />
              <Legend wrapperStyle={{ color: "#a0aec0" }} />
              <Line
                type="monotone"
                dataKey="currentPrice"
                stroke="#8884d8"
                activeDot={{
                  r: 8,
                  strokeWidth: 2,
                  fill: "#8884d8",
                  stroke: "#fff",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
