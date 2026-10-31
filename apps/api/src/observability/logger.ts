export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const

export type LogLevel = (typeof LOG_LEVELS)[number]
export type LogFields = Record<string, unknown>

export type LogRecord = LogFields & {
  timestamp: string
  level: LogLevel
  event: string
}

export type Logger = {
  debug(event: string, fields?: LogFields): void
  info(event: string, fields?: LogFields): void
  warn(event: string, fields?: LogFields): void
  error(event: string, fields?: LogFields): void
}

export type LoggerOptions = {
  level: LogLevel
  sink?: (record: LogRecord) => void
}

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const sensitiveFieldPattern =
  /(authorization|cookie|password|passwd|secret|token|api[_-]?key|credential|session|csrf|verifier|private[_-]?key)/i

const bearerPattern = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi
const MAX_STRING_LENGTH = 1_000
const MAX_OBJECT_DEPTH = 6
const MAX_ARRAY_ITEMS = 50
const MAX_OBJECT_FIELDS = 50

function sanitizeString(value: string): string {
  const sanitized = value.replace(bearerPattern, 'Bearer [REDACTED]')

  return sanitized.length > MAX_STRING_LENGTH
    ? `${sanitized.slice(0, MAX_STRING_LENGTH)}…[TRUNCATED]`
    : sanitized
}

function sanitizeValue(
  value: unknown,
  seen: WeakSet<object>,
  depth: number,
): unknown {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    return value
  }

  if (typeof value === 'string') return sanitizeString(value)
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'undefined') return undefined

  if (typeof value !== 'object') return '[UNSERIALIZABLE]'

  if (value instanceof Error) {
    return { type: sanitizeString(value.name || 'Error') }
  }

  if (value instanceof Date) return value.toISOString()

  if (value instanceof URL) {
    return `${value.protocol}//${value.host}${value.pathname}`
  }

  if (depth >= MAX_OBJECT_DEPTH) return '[MAX_DEPTH]'
  if (seen.has(value)) return '[CIRCULAR]'

  seen.add(value)

  if (Array.isArray(value)) {
    const sanitized = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeValue(item, seen, depth + 1))

    if (value.length > MAX_ARRAY_ITEMS) sanitized.push('[TRUNCATED]')
    seen.delete(value)
    return sanitized
  }

  const output: LogFields = {}
  const entries = Object.entries(value).slice(0, MAX_OBJECT_FIELDS)

  for (const [key, fieldValue] of entries) {
    if (sensitiveFieldPattern.test(key)) {
      output[key] = '[REDACTED]'
      continue
    }

    const sanitized = sanitizeValue(fieldValue, seen, depth + 1)
    if (sanitized !== undefined) output[key] = sanitized
  }

  if (Object.keys(value).length > MAX_OBJECT_FIELDS) {
    output._truncated = true
  }

  seen.delete(value)
  return output
}

export function redactLogFields(fields: LogFields = {}): LogFields {
  return sanitizeValue(fields, new WeakSet(), 0) as LogFields
}

function writeConsoleRecord(record: LogRecord): void {
  const line = JSON.stringify(record)

  switch (record.level) {
    case 'debug':
      console.debug(line)
      break
    case 'info':
      console.info(line)
      break
    case 'warn':
      console.warn(line)
      break
    case 'error':
      console.error(line)
      break
  }
}

export function createLogger({
  level,
  sink = writeConsoleRecord,
}: LoggerOptions): Logger {
  const write = (
    recordLevel: LogLevel,
    event: string,
    fields: LogFields = {},
  ) => {
    if (levelWeight[recordLevel] < levelWeight[level]) return

    const record: LogRecord = {
      ...redactLogFields(fields),
      timestamp: new Date().toISOString(),
      level: recordLevel,
      event: sanitizeString(event),
    }

    sink(record)
  }

  return {
    debug: (event, fields) => write('debug', event, fields),
    info: (event, fields) => write('info', event, fields),
    warn: (event, fields) => write('warn', event, fields),
    error: (event, fields) => write('error', event, fields),
  }
}

export const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
}
