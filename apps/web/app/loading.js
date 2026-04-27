export default function Loading() {
  return (
    <div className="grid gap-6">
      <div className="panel h-44 animate-pulse" />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="panel h-[540px] animate-pulse" />
        <div className="panel h-[540px] animate-pulse" />
      </div>
    </div>
  );
}
