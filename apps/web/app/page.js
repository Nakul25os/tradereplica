import { Suspense } from "react";
import HomeScreen from "@/components/home-screen";

export default function HomePage({ searchParams }) {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <HomeScreen initialMarketType={searchParams?.marketType} />
    </Suspense>
  );
}
