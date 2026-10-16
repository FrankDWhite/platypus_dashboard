import { NextRequest, NextResponse } from "next/server";
import { IChartPoint, IQuoteInfo } from "@/types/trade";

const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0",
};

async function fetchSingleYahooQuote(symbol: string): Promise<IQuoteInfo | null> {
  const clean = symbol.trim().toUpperCase();
  if (!clean || clean === "CASH") return null;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      clean
    )}?interval=1d&range=ytd`;
    const res = await fetch(url, {
      headers: YAHOO_HEADERS,
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta || {};
    const price = Number(meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0);
    const ytdStartPrice = Number(meta.chartPreviousClose ?? price);
    const closes: (number | null)[] =
      result.indicators?.quote?.[0]?.close || [];
    const validCloses = closes.filter(
      (c): c is number => c !== null && c !== undefined && !Number.isNaN(c)
    );
    const previousClose =
      validCloses.length >= 2
        ? validCloses[validCloses.length - 2]
        : ytdStartPrice;

    const changePercent =
      previousClose > 0 ? ((price - previousClose) / previousClose) * 100 : 0;
    const ytdChangePercent =
      ytdStartPrice > 0 ? ((price - ytdStartPrice) / ytdStartPrice) * 100 : 0;

    if (!price || Number.isNaN(price)) return null;

    return {
      symbol: clean,
      price: Number(price.toFixed(2)),
      previousClose: Number(previousClose.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      ytdStartPrice: Number(ytdStartPrice.toFixed(2)),
      ytdChangePercent: Number(ytdChangePercent.toFixed(2)),
    };
  } catch (e) {
    console.error(`Failed to fetch quote for ${clean}:`, e);
    return null;
  }
}

async function fetchYahooChart(
  symbol: string,
  range: string = "6mo",
  interval: string = "1d"
): Promise<IChartPoint[]> {
  const clean = symbol.trim().toUpperCase();
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      clean
    )}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}`;
    const res = await fetch(url, {
      headers: YAHOO_HEADERS,
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp || [];
    const closes: (number | null)[] =
      result.indicators?.quote?.[0]?.close || [];

    const points: IChartPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      if (c !== null && c !== undefined && !Number.isNaN(c)) {
        points.push({
          timestamp: new Date(timestamps[i] * 1000).toISOString(),
          price: Number(c.toFixed(2)),
        });
      }
    }
    return points;
  } catch (e) {
    console.error(`Failed to fetch chart for ${clean}:`, e);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbolsParam = searchParams.get("symbols");
  const chartSymbol = searchParams.get("chartSymbol");
  const range = searchParams.get("range") || "6mo";

  if (chartSymbol) {
    const chart = await fetchYahooChart(chartSymbol, range, "1d");
    return NextResponse.json({ chart });
  }

  const rawSymbols = symbolsParam
    ? symbolsParam.split(",").map((s) => s.trim().toUpperCase())
    : ["SPY"];
  const uniqueSymbols = Array.from(new Set([...rawSymbols, "SPY"])).filter(
    (s) => s && s !== "CASH"
  );

  const results = await Promise.all(
    uniqueSymbols.map((sym) => fetchSingleYahooQuote(sym))
  );

  const quotes: Record<string, IQuoteInfo> = {};
  for (const item of results) {
    if (item) {
      quotes[item.symbol] = item;
    }
  }

  return NextResponse.json({ quotes });
}
