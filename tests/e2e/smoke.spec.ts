import { expect, test } from '@playwright/test'

test('renders the landing page and stack overview', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Build boldly. Stay in control.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Explore the repository' }),
  ).toHaveAttribute('href', 'https://github.com/Yoganataa/honvelte-wind')
  await expect(page.getByText('Svelte 5 + Vite', { exact: true })).toBeVisible()
  await expect(page.getByText('Hono + Bun', { exact: true })).toBeVisible()
  await expect(page.getByText('Tailwind CSS 4', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Bun server' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Cloudflare Workers' }),
  ).toBeVisible()
})

test('mobile navigation opens and closes accessibly', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const menuButton = page.getByRole('button', { name: 'Open navigation menu' })
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  await menuButton.click()
  await expect(
    page.getByRole('navigation', { name: 'Mobile navigation' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Close navigation menu' }),
  ).toHaveAttribute('aria-expanded', 'true')

  const mobileNavigation = page.getByRole('navigation', {
    name: 'Mobile navigation',
  })
  await mobileNavigation.getByRole('link', { name: 'Features' }).click()
  await expect(mobileNavigation).toBeHidden()
  await expect(page).toHaveURL(/#features$/)
})

test('landing page stays within a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 })
  await page.goto('/')

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))

  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
})

test('serves a valid robots.txt instead of the SPA fallback', async ({
  request,
}) => {
  const response = await request.get('/robots.txt')

  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toMatch(/^text\/plain\b/i)

  const body = await response.text()
  expect(body).toContain('User-agent: *')
  expect(body).toContain('Allow: /')
  expect(body).toContain('Disallow: /api/')
  expect(body).not.toMatch(/<!doctype html|<html/i)
})

test('submits a greeting through the API', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Your name').fill('Nata')
  await page.getByRole('button', { name: 'Say hello' }).click()
  await expect(page.getByRole('status')).toHaveText('Hello, Nata!')
})

test('shows and clears accessible client-side validation feedback', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Say hello' }).click()

  const nameField = page.getByLabel('Your name')
  const validationMessage = page.getByRole('alert')
  await expect(validationMessage).toContainText('Name is required')
  await expect(nameField).toHaveAttribute('aria-invalid', 'true')

  const describedBy = await nameField.getAttribute('aria-describedby')
  expect(describedBy).toBeTruthy()
  await expect(page.locator(`#${describedBy}`)).toContainText(
    'Name is required',
  )

  await nameField.fill('Nata')
  await expect(nameField).not.toHaveAttribute('aria-invalid', 'true')
  await expect(validationMessage).toHaveCount(0)
})

test('provides a skip link and keyboard-operable navigation', async ({
  page,
}) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Honvelte Wind home' }),
  ).toBeFocused()
})

test('supports keyboard submission in the API playground', async ({ page }) => {
  await page.goto('/')
  const nameField = page.getByLabel('Your name')
  await nameField.focus()
  await nameField.fill('Nata')
  await nameField.press('Enter')
  await expect(page.getByRole('status')).toHaveText('Hello, Nata!')
})

test('shows API errors without exposing unexpected response details', async ({
  page,
}) => {
  await page.route('**/api/greet', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        },
      }),
    })
  })

  await page.goto('/')
  await page.getByLabel('Your name').fill('Nata')
  await page.getByRole('button', { name: 'Say hello' }).click()
  await expect(page.getByRole('alert')).toHaveText('Internal server error')
  await expect(page.getByRole('status')).toHaveCount(0)
})
