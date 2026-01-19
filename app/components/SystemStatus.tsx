"use client";

import { ISystemConfig } from "@/types/trade";

export default function SystemStatus({
  systemConfig,
}: {
  systemConfig: ISystemConfig;
}) {
  const isHealthy = systemConfig.status === "active";

  return (
    <div className="w-full bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`relative flex h-3 w-3`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </div>
          <span className="text-sm font-medium text-neutral-400 uppercase tracking-wider">System Status</span>
        </div>
        <span className={`text-sm font-bold ${isHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
          {systemConfig.status.toUpperCase()}
        </span>
      </div>
      
      <div className="mt-4 pt-4 border-t border-neutral-800 flex justify-between items-start">
        <div>
          <p className="text-xs text-neutral-500 mb-1">Last Updated</p>
          <p className="text-xs font-mono text-neutral-300">
            {new Date(systemConfig.lastUpdated).toLocaleString(undefined, {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}