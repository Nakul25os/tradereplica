import clsx from "clsx";
import { statusTone } from "@/lib/formatters";

export default function InitialAvatar({
  name,
  status = "online",
  size = "md",
  stacked = false,
}) {
  const initials = String(name || "TR")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const dimensions =
    size === "lg"
      ? "h-16 w-16 text-xl"
      : size === "sm"
        ? "h-10 w-10 text-sm"
        : "h-12 w-12 text-base";

  return (
    <div className={clsx("relative", stacked && "self-start")}>
      <div
        className={clsx(
          "flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#22c55e,#0f172a)] font-display font-semibold text-white shadow-lg",
          dimensions
        )}
      >
        {initials}
      </div>
      <span
        className={clsx(
          "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[var(--background)]",
          statusTone(status)
        )}
      />
    </div>
  );
}

