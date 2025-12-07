import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ITradeDatapoint } from '@/types/trade';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ trade_id: string }> } // <-- CHANGED: Type is now a Promise
) {
  const { trade_id } = await params;
  console.log(`Fetching datapoints for trade_id: ${trade_id}`);
  
  try {
    console.log("Attempting to connect to database...");
    const client = await clientPromise;
    console.log("Database connection successful.");
    const db = client.db("platypus_dashboard_db");

    console.log(`Fetching datapoints for trade_id: ${trade_id}...`);
    // Fetch datapoints specifically for this UUID
    const datapoints = await db.collection<ITradeDatapoint>("trade_datapoints")
      .find({ trade_id: trade_id })
      .sort({ timestamp: 1 }) // Chronological order for graphs
      .toArray();
    console.log(`Successfully fetched ${datapoints.length} datapoints.`);

    return NextResponse.json(datapoints);
    
  } catch (e) {
    if (e instanceof Error) {
      console.error(`Error fetching datapoints for trade_id: ${trade_id}:`, e.message);
      console.error("Stack trace:", e.stack);
    } else {
      console.error("An unknown error occurred:", e);
    }
    return NextResponse.json({ error: 'DB Error' }, { status: 500 });
  }
}