import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import logoUrl from "@/assets/aiko-logo.webp";
import wordmarkUrl from "@/assets/aiko-gold-wordmark.webp";

export function AuthScreen() {
  const { signInEmail, signUpEmail } = useAuth();
  const { t } = useApp();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 6) {
      toast.error("الرجاء إدخال بريد صحيح وكلمة مرور 6 أحرف على الأقل");
      return;
    }
    setBusy(true);
    const fn = mode === "signin" ? signInEmail : signUpEmail;
    const { error } = await fn(email, password);
    setBusy(false);
    if (error) {
      toast.error(error);
    } else if (mode === "signup") {
      toast.success("تم إنشاء الحساب! تحقق من بريدك لتأكيد الحساب.");
    }
  };


  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      <div className="flex flex-col items-center mb-6">
        <img src={logoUrl} alt="AIKO" className="w-20 h-20 mb-3" />
        <img src={wordmarkUrl} alt="AIKO GOLD" className="h-8 object-contain" />
      </div>

      <div className="w-full max-w-sm bg-bg-secondary border border-gold-dark/40 rounded-2xl p-6 shadow-xl">
        <h1 className="text-center text-gold font-bold text-lg mb-1">
          {mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب"}
        </h1>
        <p className="text-center text-xs text-muted-foreground mb-5">
          مزامنة سجل البحث عبر أجهزتك
        </p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            dir="ltr"
            className="w-full h-11 px-4 rounded-full bg-card border border-gold-dark/40 focus:border-gold outline-none text-sm text-foreground"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
            dir="ltr"
            className="w-full h-11 px-4 rounded-full bg-card border border-gold-dark/40 focus:border-gold outline-none text-sm text-foreground"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full h-11 rounded-full bg-gold text-black font-bold disabled:opacity-50 hover:bg-gold/90"
          >
            {busy ? "..." : mode === "signin" ? "دخول" : "إنشاء"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full mt-4 text-xs text-gold-dark hover:text-gold"
        >
          {mode === "signin" ? "ليس لديك حساب؟ إنشاء حساب" : "لديك حساب؟ تسجيل الدخول"}
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 7 29.6 5 24 5 16 5 9.1 9.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5C29.6 34.6 26.9 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.1 39 16 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.5 5.5C40.9 36.1 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
