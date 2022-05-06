import * as electronLog from 'electron-log';

const logFileFormat = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{processType}] [{level}] {text}';
electronLog.transports.console.format = logFileFormat;
electronLog.transports.file.format = logFileFormat;

// 5MB .log file size
electronLog.transports.file.maxSize = 5 * 1024 * 1024;

// one file in stand of main.log & renderer.log
electronLog.transports.file.fileName = 'logs.log';

// remove file logs for DEV
if (process.env.NODE_ENV === 'development') {
  electronLog.transports.file.level = false;
}

export const logToFile = electronLog;
