import { db, LogEntry } from "./LogDatabase";
import dayjs from "dayjs";
import pako from "pako";

export class LogCollector {
  private logExpiration: number;
  private cleanInterval: ReturnType<typeof setInterval> | null = null;
  private batchSize = 100;
  private exportCallback: (() => void) | null = null;
  private hotkeyEnabled: boolean;

  constructor(logExpiration = 3600000, enableDefaultHotkey = true) {
    this.logExpiration = logExpiration;
    this.hotkeyEnabled = enableDefaultHotkey;
    this.startAutoClean();
    if (enableDefaultHotkey) {
      this.setupDefaultHotkey();
    }
  }

  private startAutoClean() {
    this.cleanInterval = setInterval(() => {
      requestIdleCallback(() => this.cleanExpiredLogs());
    }, 15 * 60 * 1000);
  }

  async log(
    message: string | object | any[],
    level: "INFO" | "WARN" | "ERROR" = "INFO"
  ) {
    const timestamp = `[${dayjs().format("MMDD HH:mm:ss")}]`;
    let logEntry: string;

    if (typeof message === "string") {
      logEntry = `${timestamp} [${level}] - ${message}`;
    } else {
      try {
        logEntry = `${timestamp} [${level}] - ${JSON.stringify(message)}`;
      } catch (error) {
        logEntry = `${timestamp} [ERROR] - Failed to stringify log message: ${error}`;
      }
    }

    const compressedLog =
      logEntry.length > 256
        ? pako.deflate(logEntry)
        : new TextEncoder().encode(logEntry);

    try {
      await db.logs.add({
        log: compressedLog,
        timestamp: Date.now(),
        level,
      });
    } catch (error) {
      console.error("Failed to log message:", error);
    }
  }

  async cleanExpiredLogs() {
    const expirationTime = Date.now() - this.logExpiration;
    try {
      let count = 0;
      const expiredLogs = await db.logs
        .where("timestamp")
        .below(expirationTime)
        .toArray();
      for (const log of expiredLogs) {
        if (log.id !== undefined) {
          // Additional safeguard
          await db.logs.delete(log.id);
          count++;
          if (count % this.batchSize === 0) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      }
    } catch (error) {
      console.error("Failed to clean expired logs:", error);
    }
  }

  async exportLogs(
    level?: "INFO" | "WARN" | "ERROR",
    startTime?: number,
    endTime?: number
  ) {
    try {
      let logsQuery = db.logs.orderBy("timestamp");
      if (level) logsQuery = logsQuery.filter((log) => log.level === level);
      if (startTime)
        logsQuery = logsQuery.filter((log) => log.timestamp >= startTime);
      if (endTime)
        logsQuery = logsQuery.filter((log) => log.timestamp <= endTime);

      const logs = await logsQuery.toArray();
      const uncompressedLogs: string[] = logs.map((log) =>
        new TextDecoder().decode(log.log)
      );

      const logContent = uncompressedLogs.join("\n");
      const blob = new Blob([logContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "logs.txt";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export logs:", error);
    }
  }

  private setupDefaultHotkey() {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const keyState: { [key: string]: boolean } = {};

    document.addEventListener("keydown", async (event) => {
      keyState[event.key.toLowerCase()] = true;
      const modifierPressed =
        (isMac && keyState["meta"] && keyState["shift"]) ||
        (!isMac && keyState["control"] && keyState["shift"]);
      if (modifierPressed && keyState["1"]) {
        this.triggerExport();
        Object.keys(keyState).forEach((key) => (keyState[key] = false));
      }
    });

    document.addEventListener("keyup", (event) => {
      keyState[event.key.toLowerCase()] = false;
    });
  }

  onExportTrigger(callback: () => void) {
    this.exportCallback = callback;
  }

  triggerExport() {
    this.exportCallback?.();
  }

  destroy() {
    if (this.cleanInterval) {
      clearInterval(this.cleanInterval);
      this.cleanInterval = null;
    }
  }
}
