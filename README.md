# log-collector
前端日志工具，纯前端简易版，不涉及后端存储，支持热键导出，支持自定义导出方式

# Log Collector

A lightweight browser log collector with IndexedDB storage, compression, and export capabilities.

## Installation
```sh
npm install log-collector

## 使用方法
```js
import LogCollector from "log-collector";

const logger = new LogCollector();  // 默认支持 Ctrl+Shift+1 / Cmd+Shift+1

logger.log("This is an info message");
logger.log("This is a warning", "WARN");

// 自定义导出方式
logger.onExportTrigger(() => logger.exportLogs());

```