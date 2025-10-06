type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  metadata?: Record<string, unknown>
  userId?: string
  requestId?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, metadata, userId, requestId } = entry
    
    let formatted = `[${timestamp}] [${level.toUpperCase()}]`
    
    if (requestId) {
      formatted += ` [${requestId}]`
    }
    
    if (userId) {
      formatted += ` [User: ${userId}]`
    }
    
    formatted += ` ${message}`
    
    if (metadata && Object.keys(metadata).length > 0) {
      formatted += ` | Metadata: ${JSON.stringify(metadata)}`
    }
    
    return formatted
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>, context?: { userId?: string; requestId?: string }) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
      userId: context?.userId,
      requestId: context?.requestId,
    }

    const formattedMessage = this.formatMessage(entry)

    // Console output
    switch (level) {
      case 'error':
        console.error(formattedMessage)
        break
      case 'warn':
        console.warn(formattedMessage)
        break
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedMessage)
        }
        break
      default:
        console.log(formattedMessage)
    }

    // In production, you might want to send logs to external service
    if (this.isProduction && level === 'error') {
      this.sendToExternalService(entry)
    }
  }

  private sendToExternalService(_entry: LogEntry) {
    // Example: Send to external logging service
    // This could be Sentry, LogRocket, DataDog, etc.
    try {
      // Example implementation:
      // await fetch('https://your-logging-service.com/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // })
    } catch (error) {
      console.error('Failed to send log to external service:', error)
    }
  }

  info(message: string, metadata?: Record<string, unknown>, context?: { userId?: string; requestId?: string }) {
    this.log('info', message, metadata, context)
  }

  warn(message: string, metadata?: Record<string, unknown>, context?: { userId?: string; requestId?: string }) {
    this.log('warn', message, metadata, context)
  }

  error(message: string, error?: Error, context?: { userId?: string; requestId?: string }) {
    const metadata = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : undefined

    this.log('error', message, metadata, context)
  }

  debug(message: string, metadata?: Record<string, unknown>, context?: { userId?: string; requestId?: string }) {
    this.log('debug', message, metadata, context)
  }

  // API request logging
  logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: { userId?: string; requestId?: string }
  ) {
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info'
    this.log(level, `API ${method} ${url}`, {
      statusCode,
      duration: `${duration}ms`,
    }, context)
  }

  // Database operation logging
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    context?: { userId?: string; requestId?: string }
  ) {
    this.log('debug', `DB ${operation} on ${table}`, {
      duration: `${duration}ms`,
    }, context)
  }

  // Authentication logging
  logAuthEvent(
    event: 'login' | 'logout' | 'register' | 'failed_login',
    details: Record<string, unknown>,
    context?: { userId?: string; requestId?: string }
  ) {
    const level = event === 'failed_login' ? 'warn' : 'info'
    this.log(level, `Auth ${event}`, details, context)
  }
}

// Export singleton instance
export const logger = new Logger()

// Export types for use in other files
export type { LogLevel, LogEntry }