import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ITradeDatapoint } from '@/types/trade';

export async function GET(request: Request, { params }: { params: { trade_id: string } }) {
  const trade_id = params.trade_id;
  
  try {
    const client = await clientPromise;
    const db = client.db("platypus_dashboard_db");

    // Fetch datapoints specifically for this UUID
    const datapoints = await db.collection<ITradeDatapoint>("trade_datapoints")
      .find({ trade_id: trade_id })
      .sort({ timestamp: 1 }) // Chronological order for graphs
      .toArray();

    return NextResponse.json(datapoints);
    
  } catch (e) {
    return NextResponse.json({ error: 'DB Error' }, { status: 500 });
  }
}