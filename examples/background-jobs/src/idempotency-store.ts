export type IdempotencyClaim =
  | { status: 'acquired'; token: string }
  | { status: 'completed' }
  | { status: 'busy' }

export interface IdempotencyStore {
  /** Atomically acquire an unclaimed/expired key or report its current state. */
  claim(input: { key: string; now: number; leaseExpiresAt: number }): Promise<IdempotencyClaim>
  /** Complete only when the caller still owns the current lease token. */
  complete(input: { key: string; token: string; completedAt: number }): Promise<boolean>
  /** Release only the in-progress claim associated with this exact token. */
  release(input: { key: string; token: string }): Promise<void>
}

export interface IdempotencyMaintenance {
  /** Remove expired completed records and abandoned, expired leases. */
  purgeExpired(input: { now: number; limit?: number }): Promise<number>
}

export class JobLeaseLostError extends Error {
  constructor() {
    super('The job execution lease was lost before completion.')
    this.name = 'JobLeaseLostError'
  }
}
