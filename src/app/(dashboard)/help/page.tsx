"use client";

import { useState } from "react";
import {
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Rocket,
  Users,
  Factory,
  Wallet,
  Shield,
  HelpCircle,
  Keyboard,
  RotateCcw,
  MessageCircleQuestion,
} from "lucide-react";
import {
  HELP_CATEGORIES,
  HELP_ARTICLES,
  FAQ_ITEMS,
  KEYBOARD_SHORTCUTS,
} from "@/lib/help-data";
import { useReplayTour } from "@/components/shared/onboarding-tour";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "getting-started": <Rocket className="h-5 w-5" />,
  hr: <Users className="h-5 w-5" />,
  production: <Factory className="h-5 w-5" />,
  finance: <Wallet className="h-5 w-5" />,
  admin: <Shield className="h-5 w-5" />,
};

export default function HelpCenterPage() {
  const [search, setSearch] = useState("");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const replayTour = useReplayTour();

  const filteredArticles = HELP_ARTICLES.filter((article) => {
    const matchesSearch =
      !search ||
      article.title.includes(search) ||
      article.tags.some((t) => t.includes(search)) ||
      article.steps.some(
        (s) => s.title.includes(search) || s.description.includes(search)
      );
    const matchesCategory =
      !activeCategory || article.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredFaq = FAQ_ITEMS.filter(
    (faq) =>
      !search ||
      faq.question.includes(search) ||
      faq.answer.includes(search)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">دليل الاستخدام</h1>
        <p className="text-muted-foreground mt-2">
          كل اللي محتاج تعرفه عن النظام في مكان واحد
        </p>

        {/* Search */}
        <div className="relative mt-6">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث عن أي موضوع..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pr-12 pl-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={replayTour}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-card hover:bg-muted text-sm font-medium transition-colors"
        >
          <RotateCcw className="h-4 w-4 text-primary" />
          إعادة الجولة التعريفية
        </button>
        <a
          href="#faq"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-card hover:bg-muted text-sm font-medium transition-colors"
        >
          <MessageCircleQuestion className="h-4 w-4 text-primary" />
          الأسئلة الشائعة
        </a>
        <a
          href="#shortcuts"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-card hover:bg-muted text-sm font-medium transition-colors"
        >
          <Keyboard className="h-4 w-4 text-primary" />
          اختصارات الكيبورد
        </a>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !activeCategory
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          الكل
        </button>
        {HELP_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              setActiveCategory(activeCategory === cat.id ? null : cat.id)
            }
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {CATEGORY_ICONS[cat.id]}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div className="space-y-4">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">مفيش نتائج للبحث ده</p>
          </div>
        ) : (
          filteredArticles.map((article) => {
            const isExpanded = expandedArticle === article.id;
            const category = HELP_CATEGORIES.find(
              (c) => c.id === article.category
            );

            return (
              <div
                key={article.id}
                className="border rounded-xl bg-card overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedArticle(isExpanded ? null : article.id)
                  }
                  className="w-full flex items-center gap-4 p-4 md:p-5 text-right hover:bg-muted/50 transition-colors"
                >
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    {CATEGORY_ICONS[article.category] || (
                      <BookOpen className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm md:text-base">
                      {article.title}
                    </h3>
                    {category && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {category.name} · {article.steps.length} خطوات
                      </p>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t px-4 md:px-5 py-4 md:py-5 bg-muted/20">
                    <div className="space-y-4 max-w-2xl">
                      {article.steps.map((step, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="font-medium text-sm">{step.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FAQ */}
      <div id="faq" className="scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircleQuestion className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">الأسئلة الشائعة</h2>
        </div>

        <div className="space-y-2">
          {filteredFaq.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              مفيش أسئلة مطابقة للبحث
            </p>
          ) : (
            filteredFaq.map((faq, i) => {
              const isExpanded = expandedFaq === i;
              return (
                <div key={i} className="border rounded-xl bg-card overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : i)}
                    className="w-full flex items-center gap-3 p-4 text-right hover:bg-muted/50 transition-colors"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <MessageCircleQuestion className="h-4 w-4" />
                    </div>
                    <span className="flex-1 font-medium text-sm">
                      {faq.question}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="border-t px-4 py-3 bg-muted/20">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <div id="shortcuts" className="scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <Keyboard className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">اختصارات الكيبورد</h2>
        </div>

        <div className="border rounded-xl bg-card overflow-hidden divide-y">
          {KEYBOARD_SHORTCUTS.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <span className="text-sm">{shortcut.description}</span>
              <kbd className="px-3 py-1.5 bg-muted rounded-lg text-xs font-mono font-medium">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t">
        <p className="text-sm text-muted-foreground">
          محتاج مساعدة أكتر؟ استخدم{" "}
          <a href="/ai" className="text-primary hover:underline font-medium">
            المساعد الذكي
          </a>{" "}
          واسأله أي سؤال.
        </p>
      </div>
    </div>
  );
}
