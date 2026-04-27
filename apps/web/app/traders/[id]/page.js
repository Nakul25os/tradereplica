import TraderDetailView from "@/components/traders/trader-detail-view";

export default function TraderDetailPage({ params }) {
  return <TraderDetailView traderId={params.id} />;
}

