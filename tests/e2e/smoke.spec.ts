import { expect, test } from '@playwright/test'

test('renders the starter and feature cards', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Honvelte Wind' })).toBeVisible()
  await expect(page.getByText('Svelte 5 + Vite')).toBeVisible()
  await expect(page.getByText('Hono + Bun')).toBeVisible()
  await expect(page.getByText('Tailwind CSS 4')).toBeVisible()
})

test('submits a greeting through the API', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Your name').fill('Nata')
  await page.getByRole('button', { name: 'Say hello' }).click()
  await expect(page.getByRole('status')).toHaveText('Hello, Nata!')
})

test('shows client-side validation for an empty name', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Say hello' }).click()
  await expect(page.getByRole('alert')).toContainText('Name is required')
})
