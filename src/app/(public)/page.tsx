"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scissors,
  Factory,
  Users,
  Clock,
  Banknote,
  ClipboardList,
  BarChart3,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Factory,
    title: "تتبع الانتاج",
    description: "متابعة لحظية لخطوط الإنتاج والماكينات وحالة التشغيل",
  },
  {
    icon: Users,
    title: "إدارة الموظفين",
    description: "إدارة شاملة لبيانات الموظفين والأقسام والمهام",
  },
  {
    icon: Clock,
    title: "الحضور والانصراف",
    description: "تسجيل تلقائي للحضور والانصراف والإجازات",
  },
  {
    icon: Banknote,
    title: "المرتبات والبونص",
    description: "حساب المرتبات والحوافز والخصومات بدقة",
  },
  {
    icon: ClipboardList,
    title: "إدارة الأوردرات",
    description: "تتبع الأوردرات من الاستلام حتى التسليم",
  },
  {
    icon: BarChart3,
    title: "تقارير ذكية",
    description: "تقارير وإحصائيات تفصيلية لاتخاذ قرارات أفضل",
  },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Scissors className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">مصنع الملابس</span>
        </div>
        <Link
          href="/login"
          className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
        >
          تسجيل الدخول
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full opacity-15 blur-3xl"
            style={{
              background: "radial-gradient(circle, #2563eb 0%, #3b82f6 50%, transparent 70%)",
              animation: "pulse-slow 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
            style={{
              background: "radial-gradient(circle, #3b82f6 0%, #2563eb 50%, transparent 70%)",
              animation: "pulse-slow 10s ease-in-out infinite reverse",
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>نظام ERP متكامل لإدارة المصانع</span>
          </div>

          <h1
            className={`text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-tight mb-6 transition-all duration-700 delay-100 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            نظام إدارة
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #2563eb, #3b82f6, #60a5fa)",
              }}
            >
              مصنع الملابس
            </span>
          </h1>

          <p
            className={`text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            نظام متكامل لإدارة الإنتاج والموظفين والأوردرات والمرتبات بكفاءة
            عالية وتقارير ذكية تساعدك في اتخاذ القرارات الصحيحة
          </p>

          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl text-primary-foreground font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              style={{
                backgroundImage: "linear-gradient(135deg, #2563eb, #3b82f6)",
              }}
            >
              <span>دخول النظام</span>
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              كل ما تحتاجه في مكان واحد
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              أدوات متكاملة لإدارة جميع جوانب مصنعك بكفاءة واحترافية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-500 ${
                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{
                    transitionDelay: mounted ? `${400 + index * 100}ms` : "0ms",
                  }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div
            className="relative rounded-3xl p-10 md:p-16 text-center overflow-hidden"
            style={{
              backgroundImage: "linear-gradient(135deg, #2563eb, #3b82f6)",
            }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                ابدأ إدارة مصنعك الآن
              </h2>
              <p className="text-blue-100 text-lg mb-8 max-w-lg mx-auto">
                نظام سهل الاستخدام يوفر لك الوقت والجهد في إدارة جميع عمليات المصنع
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg"
              >
                <span>دخول النظام</span>
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Scissors className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">نظام إدارة مصنع الملابس</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} جميع الحقوق محفوظة
          </p>
        </div>
      </footer>

      {/* Keyframe animation */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.15); opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}
