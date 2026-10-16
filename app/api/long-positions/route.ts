import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import {
  ILongPositionV2,
  IPortfolioSummary,
  IPortfolioTransaction,
} from "@/types/trade";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("platypus_dashboard_db");

    const [positions, transactions, summary] = await Promise.all([
      db
        .collection<ILongPositionV2>("long_positions_v2")
        .find({}, { projection: { _id: 0 } })
        .toArray(),
      db
        .collection<IPortfolioTransaction>("long_transactions")
        .find({}, { projection: { _id: 0 } })
        .sort({ date: -1 })
        .toArray(),
      db
        .collection<IPortfolioSummary>("portfolio_summary")
        .findOne({}, { projection: { _id: 0 } }),
    ]);

    return NextResponse.json({
      positions,
      transactions,
      summary: summary || {
        cashBalance: 0,
        totalNetDeposited: 0,
        benchmarkSpyShares: 0,
        benchmarkAvgCostSpy: 0,
        totalRealizedPnlDollars: 0,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error("Error fetching long portfolio data:", e);
    return NextResponse.json({ error: "DB Error" }, { status: 500 });
  }
}
