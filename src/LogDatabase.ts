import Dexie, { Table } from 'dexie';

// 定义日志数据结构
export interface LogEntry {
    id?: number;
    log: Uint8Array;
    timestamp: number;
    level: 'INFO' | 'WARN' | 'ERROR';
}

// 自定义数据库类
export class LogDatabase extends Dexie {
    logs!: Table<LogEntry>;

    constructor() {
        super('LogDatabase');
        this.version(1).stores({
            logs: '++id, &timestamp, level'
        });
    }
}

export const db = new LogDatabase();
