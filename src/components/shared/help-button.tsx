"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  HelpCircle,
  X,
  ChevronLeft,
  Lightbulb,
  ArrowLeft,
  BookOpen,
  RotateCcw,
} from "lucide-react";
import { PAGE_HELP } from "@/lib/help-data";
import { useReplayTour } from "@/components/shared/onboarding-tour";

export function HelpButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const replayTour = useReplayTour();

  const pageHelp = PAGE_HELP[pathname] || findClosestHelp(pathname);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "?" && !isInputFocused()) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    },
    [open]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95"
        title="مساعدة (اضغط ?)"
      >
        {open ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-over panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 left-0 z-50 h-full w-full max-w-md bg-card border-r shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">المساعدة</h2>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {pageHelp ? (
            <>
              {/* Page info */}
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {pageHelp.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {pageHelp.description}
                </p>
              </div>

              {/* Steps */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                  الخطوات
                </h4>
                <div className="space-y-3">
                  {pageHelp.steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              {pageHelp.tips && pageHelp.tips.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      نصائح
                    </h4>
                  </div>
                  <ul className="space-y-1.5">
                    {pageHelp.tips.map((tip, i) => (
                      <li
                        key={i}
                        className="text-xs text-amber-700 dark:text-amber-400 flex gap-2 leading-relaxed"
                      >
                        <span className="shrink-0 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related pages */}
              {pageHelp.relatedPages && pageHelp.relatedPages.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    صفحات متعلقة
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {pageHelp.relatedPages.map((page) => (
                      <Link
                        key={page.href}
                        href={page.href}
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        {page.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                مفيش مساعدة متاحة للصفحة دي حالياً.
              </p>
            </div>
          )}

          {/* Footer actions */}
          <div className="border-t pt-4 space-y-2">
            <Link
              href="/help"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">دليل الاستخدام الكامل</p>
                <p className="text-xs text-muted-foreground">
                  كل الأدلة والأسئلة الشائعة
                </p>
              </div>
              <ChevronLeft className="h-4 w-4 text-muted-foreground mr-auto" />
            </Link>

            <button
              onClick={replayTour}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <RotateCcw className="h-5 w-5 text-primary" />
              <div className="text-right">
                <p className="text-sm font-medium">إعادة الجولة التعريفية</p>
                <p className="text-xs text-muted-foreground">
                  شوف الجولة التعريفية من الأول
                </p>
              </div>
            </button>
          </div>

          {/* Keyboard shortcut hint */}
          <div className="text-center">
            <p className="text-[11px] text-muted-foreground/50">
              اضغط <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">?</kbd> لفتح/إغلاق المساعدة
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function findClosestHelp(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  while (segments.length > 0) {
    const path = "/" + segments.join("/");
    if (PAGE_HELP[path]) return PAGE_HELP[path];
    segments.pop();
  }
  return null;
}

function isInputFocused() {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    (active as HTMLElement).isContentEditable
  );
}
