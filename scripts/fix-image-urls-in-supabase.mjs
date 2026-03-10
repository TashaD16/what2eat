#!/usr/bin/env node
/**
 * Скрипт для исправления URL фото в Supabase
 * Заменяет локальные пути на оригинальные URL из TheMealDB
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Загружаем переменные окружения
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env')
    const envContent = readFileSync(envPath, 'utf-8')
    const env = {}
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        env[match[1].trim()] = match[2].trim()
      }
    })
    return env
  } catch (err) {
    console.error('Ошибка загрузки .env:', err.message)
    process.exit(1)
  }
}

const env = loadEnv()
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://siaaptnnchaafzygxugc.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Ошибка: SUPABASE_SERVICE_ROLE_KEY не найден в .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Парсинг SQL для получения оригинальных URL
function parseOriginalUrls(sqlContent) {
  const urlMap = new Map() // name -> original_url
  
  // Парсим блюда с оригинальными URL
  const dishesMatch = sqlContent.match(/INSERT OR IGNORE INTO dishes[^;]+;/s)
  if (dishesMatch) {
    const valuesMatch = dishesMatch[0].match(/VALUES\s+(.+);/s)
    if (valuesMatch) {
      const valuesStr = valuesMatch[1]
      // Парсим ('name', 'description', 'image_url', ...)
      const dishRegex = /\('((?:[^']|'')+)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',/g
      let match
      while ((match = dishRegex.exec(valuesStr)) !== null) {
        const [, name, , imageUrl] = match
        const nameClean = name.replace(/''/g, "'")
        const urlClean = imageUrl.replace(/''/g, "'")
        if (urlClean && urlClean.startsWith('http')) {
          urlMap.set(nameClean, urlClean)
        }
      }
    }
  }
  
  return urlMap
}

// Получение всех рецептов из Supabase
async function getAllRecipes() {
  console.log('📥 Получение всех рецептов из Supabase...')
  const { data, error } = await supabase
    .from('global_recipes')
    .select('id, name, image_url')

  if (error) {
    throw new Error(`Ошибка получения рецептов: ${error.message}`)
  }

  console.log(`✓ Найдено ${data.length} рецептов`)
  return data
}

// Обновление URL фото
async function updateImageUrl(recipeId, newUrl) {
  const { error } = await supabase
    .from('global_recipes')
    .update({ image_url: newUrl })
    .eq('id', recipeId)

  if (error) {
    throw new Error(`Ошибка обновления: ${error.message}`)
  }
}

// Главная функция
async function main() {
  console.log('🔧 Исправление URL фото в Supabase...\n')

  // Читаем SQL файл для получения оригинальных URL
  const sqlPath = join(__dirname, '..', 'database', 'recipes-seed.sql')
  console.log(`📖 Чтение SQL файла: ${sqlPath}`)
  
  let sqlContent
  try {
    sqlContent = readFileSync(sqlPath, 'utf-8')
  } catch (err) {
    console.warn(`⚠️  Не удалось прочитать SQL файл: ${err.message}`)
    console.log('   Продолжаем без замены URL...')
    sqlContent = ''
  }

  const originalUrls = parseOriginalUrls(sqlContent)
  console.log(`✓ Найдено ${originalUrls.size} оригинальных URL в SQL\n`)

  // Получаем все рецепты
  const recipes = await getAllRecipes()

  let updated = 0
  let skipped = 0
  let notFound = 0

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i]
    
    // Пропускаем, если уже URL (не локальный путь)
    if (recipe.image_url && recipe.image_url.startsWith('http')) {
      skipped++
      continue
    }

    // Ищем оригинальный URL в SQL
    const originalUrl = originalUrls.get(recipe.name)
    
    if (originalUrl) {
      process.stdout.write(`\rОбновление: ${i + 1}/${recipes.length} - ${recipe.name.substring(0, 30)}...`)
      try {
        await updateImageUrl(recipe.id, originalUrl)
        updated++
      } catch (err) {
        console.error(`\n❌ Ошибка для "${recipe.name}":`, err.message)
      }
    } else {
      notFound++
      // Если не нашли в SQL, но есть локальный путь - оставляем как есть или удаляем
      if (recipe.image_url && recipe.image_url.startsWith('/images/')) {
        // Можно установить null или оставить локальный путь
        // await updateImageUrl(recipe.id, null)
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  console.log(`\n\n✅ Обновлено: ${updated} рецептов`)
  console.log(`⏭️  Пропущено (уже URL): ${skipped}`)
  console.log(`⚠️  Не найдено в SQL: ${notFound}`)
}

main().catch((err) => {
  console.error('\n❌ Критическая ошибка:', err)
  process.exit(1)
})
