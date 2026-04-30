import logo from "@/assets/aiko-logo.png";
import wordmark from "@/assets/aiko-gold-wordmark.png";

export function Splash() {
  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-gradient-to-b from-bg-primary via-bg-secondary to-black animate-fade-in">
      <div className="flex flex-col items-center -mt-[8vh]">
        <img
          src={logo}
          alt="AIKO GOLD"
          width={160}
          height={160}
          fetchPriority="high"
          decoding="sync"
          loading="eager"
          className="w-36 h-36 animate-float drop-shadow-[0_0_30px_hsl(var(--gold-dark)/0.8)]"
        />
        <img
          src={wordmark}
          alt="AIKO GOLD"
          fetchPriority="high"
          decoding="sync"
          loading="eager"
          className="mt-6 h-16 sm:h-20 w-auto max-w-[78vw] object-contain drop-shadow-[0_4px_24px_hsl(var(--gold-dark)/0.55)]"
        />

        {/* Loader: gold bars */}
        <div className="flex items-end gap-[3px] mt-10 h-7" role="status" aria-label="loading">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-[4px] rounded-sm animate-gold-bars"
              style={{
                background: "linear-gradient(to top, hsl(var(--gold-dark)), hsl(var(--gold)))",
                animationDelay: `${i * 0.12}s`,
                filter: "drop-shadow(0 0 4px hsl(var(--gold) / 0.5))",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
