# log-collector

一个轻量级的浏览器日志收集与导出工具，允许用户通过快捷键或自定义事件导出日志，不涉及后端存储, 非常适合前端调试与线上问题排查。

## 📌 功能介绍

- 收集日志，包括 log, warn, error。

- 支持通过默认快捷键或自定义触发事件导出日志。

  - **Windows/Linux**: `Ctrl+Shift+1`
  - **macOS**: `Cmd+Shift+1`

- 日志可导出为文本文件（.txt），包含时间戳与日志类型信息。

## ✨ 特点

- 可配置保留指定时间段的日志,默认保留最近 1 小时日志,超期日志在空闲时自动清理,不影响页面性能。

- 结构化日志内容：导出的日志带有时间戳、日志级别，便于调试与记录。

- 一键导出为文本文件：一键将所有收集到的日志导出为 .txt 文件，方便问题排查、用户反馈等场景。

- 可自定义触发方式：支持绑定自定义事件（如按钮点击）来导出日志，也支持默认快捷键导出。

- 适用于浏览器环境：特别适合前端项目中的调试工具封装或日志系统扩展。

## 安装

```sh
npm install log-collector-js
// 或
yarn add log-collector-js
```

## 示例

```typescript
import LogCollector from "log-collector-js";

const logger = new LogCollector(); // 默认支持 Ctrl+Shift+1 / Cmd+Shift+1

logger.log("This is an info message");
logger.log("This is a warning", "WARN");

// 自定义导出方式
logger.onExportTrigger(() => logger.exportLogs());
```

## 日志效果

```
[04-03 09:00:00] [log]: This is a log message
[04-03 09:01:00] [warn]: This is a warning
[04-03 09:02:00] [error]: Something went wrong
```

## 🧩 API 说明

### 构造函数

```
LogCollector {
  constructor(logExpiration = 3600000, enableDefaultHotkey = true)
}
```

| LogCollector 构造函数参数 | 描述                   | default |
| ------------------------- | ---------------------- | ------- |
| logExpiration             | 日志保留时间           | 1 小时  |
| enableDefaultHotkey       | 是否开启默认快捷键导出 | true    |

创建日志收集器实例。

### 实例方法

- logCollector.log(
  message: string | object | any[],
  level: "INFO" | "WARN" | "ERROR" = "INFO"
  ): void

  收集日志，支持三种日志级别：INFO, WARN, ERROR。

- logCollector.onExportTrigger(triggerFn: () => void): void

  注册导出日志触发器方法，自定义导出行为（例如绑定事件）,与 triggerExport方法 组合使用。

示例:
```
const logger = new LogCollector(3600000, false);  // 关闭默认快捷键

logCollector.onExportTrigger(() => logCollector.exportLogs());

// 绑定按钮触发
document.getElementById("exportBtn").addEventListener("click", () => {
    logCollector.triggerExport();
});

```

- logCollector.triggerExport(): void

  手动导出当前所有收集的日志,前置条件是 onExportTrigger 注册了触发器方法。

- logCollector.destroy(): void

  清理实例,释放内存,可以在不需要 logCollector 时调用

- logCollector.cleanExpiredLogs(): void

  手动清理过期的日志,一般用不到,初始化实例后,会自动清理过期日志.