"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Scissors, Loader2, LogIn } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const { status } = useSession();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (result?.error) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
        toast.error("فشل تسجيل الدخول", {
          description: "تأكد من اسم المستخدم وكلمة المرور",
        });
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError("حدث خطأ غير متوقع");
      toast.error("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute -top-1/3 -right-1/4 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, #2563eb 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-1/3 -left-1/4 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              style={{
                backgroundImage: "linear-gradient(135deg, #2563eb, #3b82f6)",
              }}
            >
              <Scissors className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              نظام إدارة مصنع الملابس
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              سجّل دخولك للمتابعة
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground mb-2"
              >
                اسم المستخدم
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="أدخل اسم المستخدم"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="أدخل كلمة المرور"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg px-4 py-3 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-primary-foreground font-bold text-base disabled:opacity-70 transition-all duration-300 hover:opacity-90 hover:shadow-lg cursor-pointer disabled:cursor-not-allowed"
              style={{
                backgroundImage: "linear-gradient(135deg, #2563eb, #3b82f6)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري الدخول...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>دخول النظام</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
