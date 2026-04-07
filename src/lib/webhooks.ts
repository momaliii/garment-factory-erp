import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export type WebhookEvent =
  | "order.created"
  | "order.updated"
  | "order.completed"
  | "order.overdue"
  | "employee.created"
  | "employee.absent"
  | "production.recorded"
  | "payroll.calculated"
  | "attendance.late";

export async function dispatchWebhook(event: WebhookEvent, payload: Record<string, unknown>) {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { isActive: true },
    });

    const matchingEndpoints = endpoints.filter((ep) => {
      const events = JSON.parse(ep.events) as string[];
      return events.includes(event);
    });

    for (const endpoint of matchingEndpoints) {
      const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
      const signature = crypto
        .createHmac("sha256", endpoint.secret)
        .update(body)
        .digest("hex");

      let statusCode: number | null = null;
      let response: string | null = null;

      try {
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event,
          },
          body,
          signal: AbortSignal.timeout(10000),
        });
        statusCode = res.status;
        response = await res.text().catch(() => null);
      } catch (err) {
        statusCode = 0;
        response = err instanceof Error ? err.message : "Unknown error";
      }

      await prisma.webhookLog.create({
        data: {
          endpointId: endpoint.id,
          event,
          payload: body,
          statusCode,
          response: response?.slice(0, 1000) || null,
        },
      });
    }
  } catch (error) {
    console.error("Webhook dispatch error:", error);
  }
}
