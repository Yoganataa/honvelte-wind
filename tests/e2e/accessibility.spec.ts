import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const wcagTags = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
  'best-practice',
]

test('initial page has no automatically detectable WCAG A/AA violations', async ({
  page,
}) => {
  await page.goto('/')

  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze()

  expect(results.violations).toEqual([])
})

test('validation feedback has no automatically detectable WCAG A/AA violations', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Say hello' }).click()
  await expect(page.getByRole('alert')).toContainText('Name is required')

  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze()

  expect(results.violations).toEqual([])
})

test('success feedback has no automatically detectable WCAG A/AA violations', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByLabel('Your name').fill('Nata')
  await page.getByRole('button', { name: 'Say hello' }).click()
  await expect(page.getByRole('status')).toHaveText('Hello, Nata!')

  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze()

  expect(results.violations).toEqual([])
})
