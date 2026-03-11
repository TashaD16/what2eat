#!/usr/bin/env node
/**
 * Проверка дубликатов рецептов в Supabase
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
  console.log('🔍 Проверка рецептов в Supabase...\n')

  const { data, error } = await supabase
    .from('global_recipes')
    .select('id, name, image_url, source, created_at')
    .order('name')

  if (error) {
    console.error('❌ Ошибка:', error.message)
    process.exit(1)
  }

  console.log(`📊 Всего рецептов: ${data.length}`)

  // Проверка дубликатов по имени
  const nameMap = new Map()
  const duplicates = []

  data.forEach((recipe) => {
    const name = recipe.name.toLowerCase().trim()
    if (nameMap.has(name)) {
      duplicates.push({
        name: recipe.name,
        id1: nameMap.get(name).id,
        id2: recipe.id,
      })
    } else {
      nameMap.set(name, recipe)
    }
  })

  if (duplicates.length > 0) {
    console.log(`\n⚠️  Найдено ${duplicates.length} дубликатов:`)
    duplicates.forEach((dup) => {
      console.log(`   - "${dup.name}" (ID: ${dup.id1}, ${dup.id2})`)
    })
  } else {
    console.log('✅ Дубликатов не найдено')
  }

  // Статистика по источникам
  const bySource = {}
  data.forEach((recipe) => {
    const source = recipe.source || 'unknown'
    bySource[source] = (bySource[source] || 0) + 1
  })

  console.log('\n📈 Статистика по источникам:')
  Object.entries(bySource).forEach(([source, count]) => {
    console.log(`   ${source}: ${count}`)
  })

  // Статистика по фото
  const withPhoto = data.filter((r) => r.image_url && r.image_url.startsWith('http')).length
  const withLocalPhoto = data.filter((r) => r.image_url && r.image_url.startsWith('/images/')).length
  const withoutPhoto = data.filter((r) => !r.image_url).length

  console.log('\n🖼️  Статистика по фото:')
  console.log(`   С URL (http): ${withPhoto}`)
  console.log(`   Локальные (/images/): ${withLocalPhoto}`)
  console.log(`   Без фото: ${withoutPhoto}`)
}

main().catch((err) => {
  console.error('\n❌ Ошибка:', err)
  process.exit(1)
})
