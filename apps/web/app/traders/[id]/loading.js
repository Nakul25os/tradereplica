export default function TraderLoading() {
  return (
    <div className="grid gap-6">
      <div className="panel h-44 animate-pulse" />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="panel h-[520px] animate-pulse" />
        <div className="panel h-[520px] animate-pulse" />
      </div>
    </div>
  );
}
