export const API_BASE_PATH = '/api' as const

/**
 * API paths are relative to API_BASE_PATH so the Hono mount point and browser
 * client share a single route definition.
 */
export const apiPaths = {
  health: '/health',
  ready: '/ready',
  metrics: '/metrics',
  greet: '/greet',
} as const
