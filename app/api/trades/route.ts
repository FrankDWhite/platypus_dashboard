import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { IOpenTrade, IHistoricalTrade } from '@/types/trade';

export async function GET() {
  try {
    console.error("Attempting to connect to database...");
    const client = await clientPromise;
    console.error("Database connection successful.");

    const db = client.db("platypus_dashboard_db");

    console.error("Fetching open trades...");
    const openTrades = await db.collection<IOpenTrade>("open_trades")
      .find({})
      .sort({ openedTime: -1 }) // Sort by newest
      .toArray();
    console.error("Successfully fetched open trades.");

    console.error("Fetching historical trades...");
    const historicalTrades = await db.collection<IHistoricalTrade>("historical_trades")
      .find({})
      .sort({ closedTime: -1 })
      .toArray();
    console.error("Successfully fetched historical trades.");

    console.error("Fetching configuration...");
    const config = await db.collection("configuration").findOne({});
    console.error("Successfully fetched configuration.");

    return NextResponse.json({ 
      openTrades, 
      historicalTrades,
      config 
    });
    
  } catch (e) {
    if (e instanceof Error) {
      console.error("Error fetching trades:", e.message);
      console.error("Stack trace:", e.stack);
    } else {
      console.error("An unknown error occurred:", e);
    }
    return NextResponse.json({ error: 'DB Error' }, { status: 500 });
  }
}