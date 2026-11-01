export type RetryPolicy = {
  baseDelaySeconds?: number
  maxDelaySeconds?: number
  random?: () => number
}

/** Full-jitter exponential backoff; the queue provider enforces retry count. */
export function calculateRetryDelaySeconds(
  attempts: number,
  policy: RetryPolicy = {},
): number {
  if (!Number.isSafeInteger(attempts) || attempts < 1) {
    throw new RangeError('attempts must be a positive safe integer.')
  }

  const baseDelaySeconds = policy.baseDelaySeconds ?? 5
  const maxDelaySeconds = policy.maxDelaySeconds ?? 300

  if (
    !Number.isSafeInteger(baseDelaySeconds) ||
    baseDelaySeconds < 1 ||
    baseDelaySeconds > 86_400
  ) {
    throw new RangeError('baseDelaySeconds must be between 1 and 86400.')
  }

  if (
    !Number.isSafeInteger(maxDelaySeconds) ||
    maxDelaySeconds < baseDelaySeconds ||
    maxDelaySeconds > 86_400
  ) {
    throw new RangeError('maxDelaySeconds must be between baseDelaySeconds and 86400.')
  }

  const random = (policy.random ?? Math.random)()
  if (!Number.isFinite(random) || random < 0 || random >= 1) {
    throw new RangeError('The retry random source must return a value in [0, 1).')
  }

  const exponent = Math.min(attempts - 1, 52)
  const ceiling = Math.min(maxDelaySeconds, baseDelaySeconds * 2 ** exponent)
  return Math.max(1, Math.floor(random * ceiling) + 1)
}
