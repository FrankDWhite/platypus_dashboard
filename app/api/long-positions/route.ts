import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ILongPosition } from '@/types/trade';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("platypus_dashboard_db");

    const longPositions = await db.collection<ILongPosition>("long_positions")
      .find({})
      .toArray();

    return NextResponse.json(longPositions);
    
  } catch (e) {
    console.error("Error fetching long positions:", e);
    return NextResponse.json({ error: 'DB Error' }, { status: 500 });
  }
}
