import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { IOpenTrade, IHistoricalTrade } from '@/types/trade';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("platypus_dashboard_db");

    // Fetch Open Trades
    const openTrades = await db.collection<IOpenTrade>("open_trades")
      .find({})
      .sort({ openedTime: -1 }) // Sort by newest
      .toArray();

    // Fetch Historical Trades
    const historicalTrades = await db.collection<IHistoricalTrade>("historical_trades")
      .find({})
      .sort({ closedTime: -1 })
      .limit(20) // Limit to 20 for the main view
      .toArray();

    // Fetch Config
    const config = await db.collection("configuration").findOne({});

    return NextResponse.json({ 
      openTrades, 
      historicalTrades,
      config 
    });
    
  } catch (e) {
    console.error("Error fetching trades:", e);
    return NextResponse.json({ error: 'DB Error' }, { status: 500 });
  }
}