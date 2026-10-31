import { describe, expect, test } from 'bun:test'
import { API_BASE_PATH, apiPaths } from './api-paths'

describe('API route paths', () => {
  test('defines the stable same-origin API mount and route paths', () => {
    expect(API_BASE_PATH).toBe('/api')
    expect(API_BASE_PATH + apiPaths.health).toBe('/api/health')
    expect(API_BASE_PATH + apiPaths.greet).toBe('/api/greet')
  })
})
