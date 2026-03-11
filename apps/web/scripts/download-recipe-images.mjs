#!/usr/bin/env node
/**
 * Скрипт для скачивания всех фото рецептов из URL и сохранения локально
 * Заменяет URL на локальные пути в базе данных
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, basename } from 'path'
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

// Создаём директорию для фото
const imagesDir = join(__dirname, '..', 'public', 'images', 'recipes')
if (!existsSync(imagesDir)) {
  mkdirSync(imagesDir, { recursive: true })
  console.log(`✓ Создана директория: ${imagesDir}`)
}

// Скачивание изображения
async function downloadImage(url, filename) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const filepath = join(imagesDir, filename)
    writeFileSync(filepath, buffer)
    return `/images/recipes/${filename}`
  } catch (err) {
    console.warn(`⚠️  Не удалось скачать ${url}: ${err.message}`)
    return null
  }
}

// Генерация имени файла из URL
function getFilenameFromUrl(url, recipeName) {
  try {
    // Пытаемся извлечь имя из URL
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const ext = pathname.match(/\.(jpg|jpeg|png|webp)$/i)?.[1] || 'jpg'
    
    // Создаём безопасное имя файла из названия рецепта
    const safeName = recipeName
      .toLowerCase()
      .replace(/[^a-zа-я0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)
    
    // Добавляем хеш из URL для уникальности
    const hash = url.split('/').pop().replace(/\.[^.]+$/, '').substring(0, 8)
    
    return `${safeName}-${hash}.${ext}`
  } catch {
    // Fallback: используем хеш URL
    const hash = url.split('/').pop() || Date.now().toString()
    return `recipe-${hash.substring(0, 20)}.jpg`
  }
}

// Получение всех рецептов из Supabase
async function getAllRecipes() {
  console.log('📥 Получение рецептов из Supabase...')
  const { data, error } = await supabase
    .from('global_recipes')
    .select('id, name, image_url')
    .not('image_url', 'is', null)

  if (error) {
    throw new Error(`Ошибка получения рецептов: ${error.message}`)
  }

  console.log(`✓ Найдено ${data.length} рецептов с фото`)
  return data
}

// Обновление пути к фото в Supabase
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
  console.log('🖼️  Скачивание фото рецептов...\n')

  // Получаем все рецепты
  const recipes = await getAllRecipes()
  
  if (recipes.length === 0) {
    console.log('❌ Рецепты не найдены')
    return
  }

  let downloaded = 0
  let failed = 0
  let skipped = 0

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i]
    
    // Пропускаем, если уже локальный путь
    if (recipe.image_url && recipe.image_url.startsWith('/images/')) {
      skipped++
      continue
    }

    process.stdout.write(`\rСкачивание: ${i + 1}/${recipes.length} - ${recipe.name.substring(0, 30)}...`)

    try {
      const filename = getFilenameFromUrl(recipe.image_url, recipe.name)
      const localPath = await downloadImage(recipe.image_url, filename)

      if (localPath) {
        await updateImageUrl(recipe.id, localPath)
        downloaded++
      } else {
        failed++
      }
    } catch (err) {
      console.error(`\n❌ Ошибка для "${recipe.name}":`, err.message)
      failed++
    }

    // Небольшая задержка между запросами
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  console.log(`\n\n✅ Скачано: ${downloaded} фото`)
  console.log(`⚠️  Пропущено (уже локальные): ${skipped}`)
  console.log(`❌ Ошибок: ${failed}`)
  console.log(`\n📁 Фото сохранены в: ${imagesDir}`)
}

main().catch((err) => {
  console.error('\n❌ Критическая ошибка:', err)
  process.exit(1)
})
