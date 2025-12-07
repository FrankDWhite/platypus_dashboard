"use client";

import { ISystemConfig } from "@/types/trade";

export default function SystemStatus({
  systemConfig,
}: {
  systemConfig: ISystemConfig;
}) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-xl font-semibold text-white mb-4">
        System Status
      </h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-400">Status:</p>
          <p
            className={`text-${
              systemConfig.status === "active" ? "green" : "red"
            }-500`}
          >
            {systemConfig.status}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Profit YTD:</p>
          <p className="text-white">${systemConfig.profitYTD.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-400">Last Updated:</p>
          <p className="text-white">
            {new Date(systemConfig.lastUpdated).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
