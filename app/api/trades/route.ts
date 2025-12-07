import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { IOpenTrade, IHistoricalTrade } from '@/types/trade';

export async function GET() {
  try {
    console.log("Attempting to connect to database...");
    const client = await clientPromise;
    console.log("Database connection successful.");

    const db = client.db("platypus_dashboard_db");

    console.log("Fetching open trades...");
    const openTrades = await db.collection<IOpenTrade>("open_trades")
      .find({})
      .sort({ openedTime: -1 }) // Sort by newest
      .toArray();
    console.log("Successfully fetched open trades.");

    console.log("Fetching historical trades...");
    const historicalTrades = await db.collection<IHistoricalTrade>("historical_trades")
      .find({})
      .sort({ closedTime: -1 })
      .limit(20) // Limit to 20 for the main view
      .toArray();
    console.log("Successfully fetched historical trades.");

    console.log("Fetching configuration...");
    const config = await db.collection("configuration").findOne({});
    console.log("Successfully fetched configuration.");

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