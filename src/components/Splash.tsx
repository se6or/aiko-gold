import logo from "@/assets/aiko-logo.png";

export function Splash() {
  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-gradient-to-b from-bg-primary via-bg-secondary to-black animate-fade-in">
      <div className="flex flex-col items-center -mt-[10vh]">
        <img
          src={logo}
          alt="AIKO GOLD"
          width={160}
          height={160}
          className="w-40 h-40 animate-float drop-shadow-[0_0_30px_hsl(var(--gold-dark)/0.8)]"
        />
        <h1 className="mt-2 text-3xl gold-text tracking-wider">AIKO GOLD</h1>
        <p className="mt-1 text-xs tracking-[0.3em] text-gold-dark uppercase">
          Premium Player
        </p>
        <div className="mt-8 w-12 h-12 rounded-full border-[3px] border-gold-dark/30 border-t-gold animate-spin-gold shadow-gold" />
      </div>
    </div>
  );
}
