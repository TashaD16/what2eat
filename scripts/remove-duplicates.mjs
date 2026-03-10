#!/usr/bin/env node
/**
 * Удаление дубликатов рецептов в Supabase
 * Оставляет самый старый рецепт, удаляет остальные
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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

async function main() {
  console.log('🔍 Поиск и удаление дубликатов...\n')

  const { data, error } = await supabase
    .from('global_recipes')
    .select('id, name, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Ошибка:', error.message)
    process.exit(1)
  }

  // Группируем по имени (без учета регистра)
  const nameGroups = new Map()
  data.forEach((recipe) => {
    const nameKey = recipe.name.toLowerCase().trim()
    if (!nameGroups.has(nameKey)) {
      nameGroups.set(nameKey, [])
    }
    nameGroups.get(nameKey).push(recipe)
  })

  // Находим дубликаты
  const duplicatesToRemove = []
  nameGroups.forEach((recipes, nameKey) => {
    if (recipes.length > 1) {
      // Оставляем самый старый (первый в отсортированном списке)
      const toKeep = recipes[0]
      const toRemove = recipes.slice(1)
      
      console.log(`📋 "${recipes[0].name}":`)
      console.log(`   ✓ Оставляем: ${toKeep.id} (создан: ${toKeep.created_at})`)
      
      toRemove.forEach((recipe) => {
        console.log(`   ✗ Удаляем: ${recipe.id} (создан: ${recipe.created_at})`)
        duplicatesToRemove.push(recipe.id)
      })
    }
  })

  if (duplicatesToRemove.length === 0) {
    console.log('✅ Дубликатов не найдено')
    return
  }

  console.log(`\n🗑️  Удаление ${duplicatesToRemove.length} дубликатов...`)

  // Удаляем дубликаты
  const { error: deleteError } = await supabase
    .from('global_recipes')
    .delete()
    .in('id', duplicatesToRemove)

  if (deleteError) {
    console.error('❌ Ошибка удаления:', deleteError.message)
    process.exit(1)
  }

  console.log(`✅ Удалено ${duplicatesToRemove.length} дубликатов`)

  // Проверяем результат
  const { data: finalData } = await supabase
    .from('global_recipes')
    .select('id', { count: 'exact', head: true })

  console.log(`\n📊 Итого уникальных рецептов: ${finalData?.length || 0}`)
}

main().catch((err) => {
  console.error('\n❌ Ошибка:', err)
  process.exit(1)
})
