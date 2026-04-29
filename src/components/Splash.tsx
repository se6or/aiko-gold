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

        {/* Loader: dual gold arc, smooth & professional */}
        <div className="relative mt-10 w-12 h-12" role="status" aria-label="loading">
          <span className="absolute inset-0 rounded-full border-[2px] border-gold-dark/15" />
          <span
            className="absolute inset-0 rounded-full border-[2px] border-transparent animate-spin-gold"
            style={{
              borderTopColor: "hsl(var(--gold))",
              borderRightColor: "hsl(var(--gold-dark) / 0.6)",
              filter: "drop-shadow(0 0 6px hsl(var(--gold-dark) / 0.45))",
            }}
          />
        </div>
      </div>
    </div>
  );
}
