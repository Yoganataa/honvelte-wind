import { expect, test } from '@playwright/test'

test('renders the starter and feature cards', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Honvelte Wind' }),
  ).toBeVisible()
  await expect(page.getByText('Svelte 5 + Vite', { exact: true })).toBeVisible()
  await expect(page.getByText('Hono + Bun', { exact: true })).toBeVisible()
  await expect(page.getByText('Tailwind CSS 4', { exact: true })).toBeVisible()
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

test('supports keyboard navigation through the greeting form', async ({
  page,
}) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Your name')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Say hello' })).toBeFocused()
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
