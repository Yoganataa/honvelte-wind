import { expect, test } from '@playwright/test'

test('health endpoint returns a request-correlated response', async ({
  request,
}) => {
  const response = await request.get('/api/health')
  expect(response.ok()).toBeTruthy()
  expect(response.headers()['x-request-id']).toBeTruthy()
  expect(await response.json()).toMatchObject({ status: 'ok' })
})

test('readiness endpoint reports that the service accepts requests', async ({
  request,
}) => {
  const response = await request.get('/api/ready')

  expect(response.status()).toBe(200)
  expect(await response.json()).toMatchObject({ status: 'ready' })
})

test('unknown API paths return JSON 404 rather than the SPA', async ({
  request,
}) => {
  const response = await request.get('/api/not-a-route')
  expect(response.status()).toBe(404)
  expect(response.headers()['content-type']).toContain('application/json')
})
