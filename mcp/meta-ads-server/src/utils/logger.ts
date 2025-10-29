// Simple structured logger

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: any
}

class Logger {
  log(level: LogLevel, message: string, context?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    const formatted = `[${entry.timestamp}] [${level.toUpperCase()}] ${message}`
    
    if (context) {
      console.log(formatted, context)
    } else {
      console.log(formatted)
    }
  }

  info(message: string, context?: any) {
    this.log('info', message, context)
  }

  warn(message: string, context?: any) {
    this.log('warn', message, context)
  }

  error(message: string, context?: any) {
    this.log('error', message, context)
  }

  debug(message: string, context?: any) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      this.log('debug', message, context)
    }
  }
}

export const logger = new Logger()

