import HomeScreen from "@/components/home-screen";

export default function HomePage({ searchParams }) {
  return <HomeScreen initialMarketType={searchParams?.marketType} />;
}
