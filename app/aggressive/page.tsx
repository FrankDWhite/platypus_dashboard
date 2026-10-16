import LongPositionsClient from "../components/LongPositionsClient";

export default function AggressivePortfolioPage() {
  return (
    <main className="min-h-screen bg-black w-full">
      <LongPositionsClient initialPortfolio="aggressive" />
    </main>
  );
}
