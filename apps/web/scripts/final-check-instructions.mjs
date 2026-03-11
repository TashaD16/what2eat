#!/usr/bin/env node
/**
 * Финальная проверка всех рецептов на наличие пошаговых инструкций
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

function hasValidInstructions(recipe) {
  if (!recipe.instructions) return false
  if (!Array.isArray(recipe.instructions)) return false
  if (recipe.instructions.length === 0) return false
  
  return recipe.instructions.some(
    (step) => step && step.description && step.description.trim().length > 10
  )
}

async function main() {
  console.log('🔍 Финальная проверка рецептов...\n')

  const { data, error } = await supabase
    .from('global_recipes')
    .select('id, name, instructions')

  if (error) {
    console.error('❌ Ошибка:', error.message)
    process.exit(1)
  }

  console.log(`📊 Всего рецептов: ${data.length}\n`)

  const withoutInstructions = data.filter((r) => !hasValidInstructions(r))

  if (withoutInstructions.length === 0) {
    console.log('✅ Все рецепты имеют пошаговые инструкции!')
    console.log(`\n📈 Статистика:`)
    console.log(`   Всего рецептов: ${data.length}`)
    console.log(`   С инструкциями: ${data.length}`)
    console.log(`   Без инструкций: 0`)
    return
  }

  console.log(`⚠️  Найдено ${withoutInstructions.length} рецептов БЕЗ инструкций:\n`)
  withoutInstructions.forEach((r, i) => {
    console.log(`${i + 1}. "${r.name}" (ID: ${r.id})`)
    if (r.instructions) {
      console.log(`   Инструкции: ${JSON.stringify(r.instructions).substring(0, 100)}...`)
    } else {
      console.log(`   Инструкции: отсутствуют`)
    }
  })

  console.log(`\n❌ Эти рецепты нужно заменить или удалить!`)
  process.exit(1)
}

main().catch((err) => {
  console.error('\n❌ Ошибка:', err)
  process.exit(1)
})
