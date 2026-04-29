import logo from "@/assets/aiko-logo.png";
import wordmark from "@/assets/aiko-gold-wordmark.png";

export function Splash() {
  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-gradient-to-b from-bg-primary via-bg-secondary to-black animate-fade-in">
      <div className="flex flex-col items-center -mt-[10vh]">
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
          className="mt-5 h-16 sm:h-20 w-auto max-w-[78vw] object-contain drop-shadow-[0_4px_24px_hsl(var(--gold-dark)/0.55)]"
        />
        <p className="mt-3 text-[11px] tracking-[0.5em] text-gold-dark/90 uppercase">
          Premium Player
        </p>
        <div className="mt-8 w-12 h-12 rounded-full border-[3px] border-gold-dark/30 border-t-gold animate-spin-gold shadow-gold" />
      </div>
    </div>
  );
}
