interface Props {
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Unified brand loader — gold animated bars.
 * Used everywhere a loading indicator is needed (splash, video, details, etc.)
 */
export function BrandLoader({ size = "md", className = "" }: Props) {
  const dims =
    size === "sm"
      ? { h: "h-4", w: "w-[2px]", gap: "gap-[2px]" }
      : size === "lg"
      ? { h: "h-9", w: "w-[5px]", gap: "gap-[4px]" }
      : { h: "h-6", w: "w-[3px]", gap: "gap-[3px]" };

  return (
    <div
      className={`flex items-end ${dims.gap} ${dims.h} ${className}`}
      role="status"
      aria-label="loading"
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`${dims.w} rounded-sm animate-gold-bars`}
          style={{
            background:
              "linear-gradient(to top, hsl(var(--gold-dark)), hsl(var(--gold)))",
            animationDelay: `${i * 0.12}s`,
            filter: "drop-shadow(0 0 4px hsl(var(--gold) / 0.5))",
          }}
        />
      ))}
    </div>
  );
}
