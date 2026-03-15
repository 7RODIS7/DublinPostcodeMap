import { expect, test } from '@playwright/test'

test('loads the main map shell and postal area sidebar', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Postal areas' })).toBeVisible()
  await expect(page.getByTestId('district-sidebar')).toBeVisible()
  await expect(page.getByTestId('map-canvas')).toBeVisible()
  await expect(page.getByTestId('sidebar-meta')).toContainText('areas')
})

test('selecting a district updates the selection panel', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('district-button-dublin-6').click()

  await expect(page.getByTestId('selected-district-name')).toHaveText('Dublin 6')
})

test('sidebar can be hidden and reopened', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('sidebar-toggle-hide').click()
  await expect(page.getByTestId('sidebar')).toHaveAttribute('data-open', 'false')
  await expect(page.getByTestId('sidebar-toggle-show')).toBeVisible()

  await page.getByTestId('sidebar-toggle-show').click()
  await expect(page.getByTestId('sidebar')).toHaveAttribute('data-open', 'true')
})

test('district labels can be hidden from map settings', async ({ page }) => {
  await page.goto('/')

  const labels = page.locator('[data-testid^="district-label-"]')
  await expect(labels.first()).toBeVisible()

  await page.getByTestId('settings-toggle').click()
  await expect(page.getByTestId('map-settings')).toBeVisible()
  await page.getByTestId('district-labels-toggle').click()

  await expect(labels).toHaveCount(0)
})

test('extended district labels can be enabled from map settings', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('settings-toggle').click()
  await page.getByTestId('district-label-mode-extended').click()

  await expect(page.getByTestId('district-label-dublin-1')).toContainText('2.8')
  await expect(page.getByTestId('district-label-dublin-11')).toContainText('2.8')
  await expect(page.getByTestId('district-label-dublin-11')).toContainText('2')
})

test('map display settings persist after reload', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('settings-toggle').click()
  await page.getByTestId('district-label-mode-extended').click()
  await page.locator('.map-settings__slider input').evaluate((element) => {
    const input = element as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set

    setter?.call(input, '0.31')
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await expect(page.getByText('31%')).toBeVisible()
  await page.getByTestId('district-labels-toggle').click()

  await page.reload()
  await page.getByTestId('settings-toggle').click()

  await expect(page.getByTestId('district-labels-toggle')).toHaveAttribute('data-active', 'false')
  await expect(page.locator('.map-settings__slider input')).toHaveValue('0.31')

  await page.getByTestId('district-labels-toggle').click()
  await expect(page.getByTestId('district-label-mode-extended')).toHaveAttribute('data-active', 'true')
})

test('transport overlay toggles are available and persist after reload', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('settings-toggle').click()
  await expect(page.getByTestId('transport-toggle-rail')).toHaveAttribute('data-active', 'true')
  await expect(page.getByTestId('transport-toggle-luas')).toHaveAttribute('data-active', 'true')
  await expect(page.getByTestId('transport-toggle-bus')).toHaveAttribute('data-active', 'false')
  await expect(page.getByTestId('transport-toggle-metro')).toHaveAttribute('data-active', 'false')

  await page.getByTestId('transport-toggle-bus').click()
  await page.getByTestId('transport-toggle-metro').click()
  await expect(page.getByTestId('transport-toggle-bus')).toHaveAttribute('data-active', 'true')
  await expect(page.getByTestId('transport-toggle-metro')).toHaveAttribute('data-active', 'true')

  await page.reload()
  await page.getByTestId('settings-toggle').click()
  await expect(page.getByTestId('transport-toggle-bus')).toHaveAttribute('data-active', 'true')
  await expect(page.getByTestId('transport-toggle-metro')).toHaveAttribute('data-active', 'true')
})

test('selection popover includes a Google Maps link for the chosen area', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('district-button-dublin-9').click()

  await expect(page.getByTestId('selection-google-maps')).toHaveAttribute(
    'href',
    /google\.com\/maps\/@\?api=1&map_action=map&center=.*&zoom=\d+/,
  )
  await expect(page.getByTestId('selection-google-maps')).toHaveAttribute(
    'data-tooltip',
    'Open in Google Maps',
  )
})

test('sidebar expansion stays navigation-only without duplicate summary text', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Expand Dublin 1', exact: true }).click()

  await expect(page.getByText('Central and practical, but less calm as a residential base.')).toHaveCount(0)
  await expect(page.getByText('City core access')).toHaveCount(0)
  await expect(page.getByText('Abbey Street')).toBeVisible()
})

test('selection help explains rating metrics including Value', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('district-button-dublin-14').click()
  await page.getByLabel('Show grade and area legend').click()

  await expect(page.getByTestId('selection-legend')).toContainText(
    'Value = Balance between housing cost and overall quality of life.',
  )
  await expect(page.getByTestId('selection-legend')).toContainText(
    'Amenities = Shops, cafes, sports, groceries and everyday local convenience.',
  )
  await expect(page.getByTestId('selection-legend')).toContainText(
    'Green = Usable public parks, beaches, seafront walks and outdoor green access from public OSM-tagged spaces, excluding private club land where tagged.',
  )
})

test('sidebar can sort districts by amenities', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('sort-mode').selectOption('amenities')

  await expect(page.getByTestId('district-button-dublin-1')).toBeVisible()
  await expect(page.locator('.district-card__sort-chip[data-metric=\"amenities\"]').first()).toBeVisible()
})

test('grade chips can narrow the list to grade A districts', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('grade-toggle-b').click()
  await page.getByTestId('grade-toggle-c').click()
  await page.getByTestId('grade-toggle-d').click()

  await expect(page.getByTestId('district-button-dublin-4')).toBeVisible()
  await expect(page.getByTestId('district-button-dublin-24')).toHaveCount(0)
  await expect(page.getByTestId('district-button-routing-a94')).toBeVisible()
})

test('grade presets can quickly switch to B+ filtering', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('grade-preset-b-plus').click()

  await expect(page.getByTestId('district-button-dublin-4')).toBeVisible()
  await expect(page.getByTestId('district-button-dublin-24')).toHaveCount(0)
  await expect(page.getByTestId('grade-toggle-a')).toHaveAttribute('data-active', 'true')
  await expect(page.getByTestId('grade-toggle-b')).toHaveAttribute('data-active', 'true')
  await expect(page.getByTestId('grade-toggle-c')).toHaveAttribute('data-active', 'false')
})

test('lifestyle tag filter can focus coastal districts', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('tag-toggle-coastal').click()

  await expect(page.getByTestId('district-button-dublin-13')).toBeVisible()
  await expect(page.getByTestId('district-button-routing-k36')).toBeVisible()
  await expect(page.getByTestId('district-button-dublin-11')).toHaveCount(0)
})

test('routing key areas appear in the list and selection panel', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('district-button-routing-a94').click()

  await expect(page.getByTestId('selected-district-name')).toHaveText('A94')
  await page.getByLabel('Show grade and area legend').click()
  await expect(page.getByTestId('selection-legend')).toContainText(
    'A/K codes = outer Dublin and suburban postcode zones',
  )
})

test('south-east seam locations remain navigable under Dublin 18', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Expand Dublin 18', exact: true }).click()
  await page.getByText('Shanganagh Vale').click()

  await expect(page.getByTestId('selected-district-name')).toHaveText('Dublin 18')
})

test('subarea list exposes an explicit Google Maps action', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Expand Dublin 18', exact: true }).click()
  await expect(page.getByTestId('subarea-map-shanganagh-vale')).toHaveAttribute(
    'href',
    /google\.com\/maps\/@\?api=1&map_action=map&center=53\.2526,-6\.1404&zoom=16/,
  )
  await expect(page.getByTestId('subarea-map-shanganagh-vale')).toHaveAttribute(
    'data-tooltip',
    'Open in Google Maps',
  )
})

test('Portmarnock is navigated under Dublin 13 rather than K36', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Expand Dublin 13', exact: true }).click()
  await page.getByText('Portmarnock').click()

  await expect(page.getByTestId('selected-district-name')).toHaveText('Dublin 13')
})
