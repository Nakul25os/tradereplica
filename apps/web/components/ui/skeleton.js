import clsx from "clsx";

export default function Skeleton({ className }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-2xl bg-slate-300/30 dark:bg-slate-700/40",
        className
      )}
    />
  );
}

