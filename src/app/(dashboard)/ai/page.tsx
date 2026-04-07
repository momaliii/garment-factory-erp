"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import {
  Bot,
  Send,
  User,
  FileText,
  TrendingUp,
  DollarSign,
  BarChart3,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickReports = [
  { type: "performance", label: "تحليل أداء الموظفين", icon: TrendingUp },
  { type: "orders", label: "حالة الأوردرات", icon: FileText },
  { type: "financial", label: "ملخص مالي", icon: DollarSign },
  { type: "general", label: "ملخص شامل", icon: BarChart3 },
];

const suggestedQuestions = [
  "مين أحسن موظف في الانتاج الشهر ده؟",
  "إيه الأوردرات اللي ممكن تتأخر؟",
  "إيه نسبة الحضور الشهر ده؟",
  "إيه اقتراحاتك لتحسين الانتاجية؟",
  "كام موظف حاضر النهاردة؟",
  "اعملي ملخص شهر الحالي",
];

export default function AiPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: messageText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        setMessages([...newMessages, { role: "assistant", content: data.error }]);
      } else {
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      }
    } catch {
      toast.error("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  async function generateReport(type: string) {
    setReportLoading(type);
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: `اعمل تقرير: ${quickReports.find((r) => r.type === type)?.label}` },
          { role: "assistant", content: data.report },
        ]);
      }
    } catch {
      toast.error("حدث خطأ في إنشاء التقرير");
    } finally {
      setReportLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="المساعد الذكي"
        description="اسأل عن أي حاجة في المصنع - الانتاج، الحضور، الأوردرات، أو اطلب تقرير ذكي"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card className="flex flex-col h-[calc(100vh-220px)]">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-primary" />
              محادثة مع المساعد
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">أهلاً! أنا مساعدك الذكي</h3>
                  <p className="text-muted-foreground text-sm">اسألني أي سؤال عن المصنع أو اطلب تقرير</p>
                </div>
                <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-xs text-right p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === "user" ? "bg-primary" : "bg-muted"
                )}>
                  {msg.role === "user" ? (
                    <User className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب سؤالك هنا..."
                disabled={loading}
                className="flex-1"
              />
              <Button type="submit" disabled={loading || !input.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">تقارير ذكية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickReports.map((report) => (
                <Button
                  key={report.type}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => generateReport(report.type)}
                  disabled={reportLoading !== null}
                >
                  {reportLoading === report.type ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <report.icon className="h-4 w-4" />
                  )}
                  {report.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setMessages([])}
            >
              مسح المحادثة
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
