export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { initBackupScheduler } = await import("@/lib/backup-scheduler");
      initBackupScheduler();
    } catch (err) {
      console.error("[instrumentation] Backup scheduler init failed:", err);
    }
  }
}
