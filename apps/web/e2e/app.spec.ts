import { test, expect, Page } from '@playwright/test'

// Ждём полной загрузки приложения: заголовок + хотя бы один ингредиент в списке
async function waitForAppReady(page: Page) {
  await page.waitForSelector('text=Что есть в холодильнике?', { timeout: 20000 })
  // Ждём пока БД загрузит ингредиенты (появится хоть одна карточка)
  await page.waitForSelector('.MuiPaper-root [class*="MuiTypography"]', { timeout: 20000 })
}

// Кликаем ингредиент по точному тексту внутри карточки
async function clickIngredient(page: Page, name: string) {
  await page.locator('.MuiGrid-item').filter({ hasText: new RegExp(`^${name}$`) }).first().click()
}

test.describe('What2Eat — основные сценарии', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Очищаем localStorage перед каждым тестом чтобы избежать загрязнения состояния
    await page.evaluate(() => localStorage.clear())
    await waitForAppReady(page)
  })

  // ─── 1. Выбор ингредиентов → поиск → свайп ──────────────────────────────────
  test('выбор ингредиентов и поиск блюд', async ({ page }) => {
    await clickIngredient(page, 'Курица')
    await clickIngredient(page, 'Лук')

    await expect(page.getByText(/Выбрано: \d/)).toBeVisible()

    await page.getByRole('button', { name: 'Найти блюда' }).click()

    await expect(page.getByText(/блюд осталось|Все просмотрены|В базе нет подходящих блюд/)).toBeVisible({ timeout: 10000 })
  })

  // ─── 2. Свайп влево и вправо через кнопки ────────────────────────────────────
  test('свайп влево и вправо', async ({ page }) => {
    // Несколько ингредиентов для гарантированного результата
    await clickIngredient(page, 'Курица')
    await clickIngredient(page, 'Лук')
    await clickIngredient(page, 'Морковь')
    await page.getByRole('button', { name: 'Найти блюда' }).click()

    // Ждём любого результата свайп-дека
    await expect(page.getByText(/блюд осталось|Все просмотрены|В базе нет подходящих блюд/)).toBeVisible({ timeout: 10000 })

    // Если блюда найдены — проверяем кнопки
    const hasCards = await page.getByText(/блюд осталось/).isVisible().catch(() => false)
    if (hasCards) {
      const dislikeBtn = page.locator('button').filter({ has: page.locator('[data-testid="CloseIcon"]') })
      await expect(dislikeBtn).toBeVisible()
      await dislikeBtn.click()

      const likeBtn = page.locator('button').filter({ has: page.locator('[data-testid="FavoriteIcon"]') })
      await expect(likeBtn).toBeVisible()
      await likeBtn.click()
    }
  })

  // ─── 3. Рандомайзер ──────────────────────────────────────────────────────────
  test('рандомайзер открывает свайп с блюдами', async ({ page }) => {
    await page.getByRole('button', { name: 'Рандомайзер' }).click()

    await expect(page.getByText(/блюд осталось|Все просмотрены|В базе нет подходящих блюд/)).toBeVisible({ timeout: 10000 })
  })

  // ─── 4. Фильтр "только веганское" ────────────────────────────────────────────
  test('фильтр "только веганское"', async ({ page }) => {
    // Switch находится внутри FormControlLabel рядом с текстом
    await page.locator('label').filter({ hasText: 'Только веганское' }).locator('input[type="checkbox"]').check()

    await clickIngredient(page, 'Курица')
    await page.getByRole('button', { name: 'Найти блюда' }).click()

    await expect(page.getByText(/блюд осталось|Все просмотрены|В базе нет подходящих блюд/)).toBeVisible({ timeout: 10000 })
  })

  // ─── 5. Фильтр "Немного докупить" ────────────────────────────────────────────
  test('фильтр "немного докупить"', async ({ page }) => {
    await page.locator('label').filter({ hasText: 'Немного докупить' }).locator('input[type="checkbox"]').check()

    await clickIngredient(page, 'Курица')
    await page.getByRole('button', { name: 'Найти блюда' }).click()

    await expect(page.getByText(/блюд осталось|Все просмотрены|В базе нет подходящих блюд/)).toBeVisible({ timeout: 10000 })
  })

  // ─── 6. Свайп до конца → результаты → список покупок ─────────────────────────
  test('свайп до конца → результаты → список покупок', async ({ page }) => {
    await clickIngredient(page, 'Курица')
    await clickIngredient(page, 'Макароны')
    await clickIngredient(page, 'Рис')
    await page.getByRole('button', { name: 'Найти блюда' }).click()
    await expect(page.getByText(/\d+ блюд осталось/)).toBeVisible({ timeout: 10000 })

    // Кликаем кнопку "❤️" (лайк) в цикле — надёжнее drag-симуляции для TinderCard
    const likeBtn = page.locator('button').filter({ has: page.locator('[data-testid="FavoriteIcon"]') })
    for (let i = 0; i < 20; i++) {
      const done = await page.getByText(/Все просмотрены|Посмотреть результаты/).isVisible().catch(() => false)
      if (done) break
      if (!await likeBtn.isVisible({ timeout: 1000 }).catch(() => false)) break
      const counterBefore = await page.getByText(/\d+ блюд осталось/).textContent().catch(() => null)
      await likeBtn.click()
      if (counterBefore) {
        await page.waitForFunction(
          (prev) => {
            const t = document.body.innerText
            return !t.includes(prev) || t.includes('Посмотреть результаты') || t.includes('Все просмотрены')
          },
          counterBefore,
          { timeout: 3000 }
        ).catch(() => {})
      }
    }

    const resultsBtn = page.getByRole('button', { name: 'Посмотреть результаты' })
    if (await resultsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await resultsBtn.click()
    }

    await expect(page.getByRole('heading', { name: 'Понравившиеся блюда' })).toBeVisible({ timeout: 8000 })

    const shoppingBtn = page.getByRole('button', { name: 'Список покупок' })
    if (await shoppingBtn.isEnabled()) {
      await shoppingBtn.click()
      await expect(page.getByRole('heading', { name: /Список покупок/ })).toBeVisible({ timeout: 5000 })
    }
  })

  // ─── 7. Планировщик недели ────────────────────────────────────────────────────
  test('планировщик открывается через AppBar', async ({ page }) => {
    await page.getByRole('button', { name: 'Планировщик' }).click()
    await expect(page.getByRole('heading', { name: 'Планировщик недели' })).toBeVisible({ timeout: 5000 })
  })

  // ─── 8. Навигация назад со свайпа ─────────────────────────────────────────────
  test('навигация назад со свайпа', async ({ page }) => {
    await clickIngredient(page, 'Курица')
    await clickIngredient(page, 'Лук')
    await page.getByRole('button', { name: 'Найти блюда' }).click()

    // Ждём загрузки свайп-дека (любой исход)
    await expect(page.getByText(/блюд осталось|Все просмотрены|В базе нет подходящих блюд/)).toBeVisible({ timeout: 10000 })

    // Кнопка возврата называется "Назад" если блюда найдены, или "Изменить ингредиенты" если нет
    await page.getByRole('button', { name: /Назад|Изменить ингредиенты/ }).first().click()
    await expect(page.getByText('Что есть в холодильнике?')).toBeVisible({ timeout: 5000 })
  })

  // ─── 9. Бюджет-фильтр ─────────────────────────────────────────────────────────
  test('фильтр по бюджету', async ({ page }) => {
    await page.locator('label').filter({ hasText: 'Бюджет' }).locator('input[type="checkbox"]').check()

    await expect(page.getByLabel('Максимум')).toBeVisible({ timeout: 3000 })
    await page.getByLabel('Максимум').fill('5')

    await clickIngredient(page, 'Курица')
    await page.getByRole('button', { name: 'Найти блюда' }).click()
    await expect(page.getByText(/блюд осталось|Все просмотрены|В базе нет подходящих блюд/)).toBeVisible({ timeout: 10000 })
  })
})
