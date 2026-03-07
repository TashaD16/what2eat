#!/usr/bin/env node
/**
 * Проверка работоспособности OpenAI API ключа.
 * Читает VITE_OPENAI_API_KEY из .env и делает тестовый запрос к API.
 * Запуск: node scripts/test-openai-key.mjs
 */

import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnv() {
  const path = join(root, '.env')
  if (!existsSync(path)) {
    console.error('❌ Файл .env не найден в корне проекта.')
    process.exit(1)
  }
  const content = readFileSync(path, 'utf-8')
  const keyLine = content.split('\n').find((l) => l.startsWith('VITE_OPENAI_API_KEY='))
  if (!keyLine) {
    console.error('❌ В .env нет переменной VITE_OPENAI_API_KEY.')
    process.exit(1)
  }
  const key = keyLine.replace(/^VITE_OPENAI_API_KEY=/, '').trim()
  if (!key) {
    console.error('❌ VITE_OPENAI_API_KEY пустой. Вставьте ключ в .env после знака =.')
    process.exit(1)
  }
  return key
}

async function testKey() {
  console.log('Проверка OpenAI API ключа...\n')
  const key = loadEnv()
  console.log('✓ Ключ найден в .env (длина:', key.length, 'символов)\n')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Скажи только: ок' }],
    }),
  })

  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    console.error('❌ Ответ API не JSON:', text.slice(0, 200))
    process.exit(1)
  }

  if (!res.ok) {
    console.error('❌ OpenAI API вернул ошибку:', res.status, res.statusText)
    console.error('   ', data.error?.message || text)
    if (data.error?.code === 'invalid_api_key') {
      console.error('\n   Проверьте ключ на https://platform.openai.com/api-keys')
    }
    process.exit(1)
  }

  const reply = data.choices?.[0]?.message?.content
  console.log('✅ Ключ рабочий. Тестовый ответ:', reply || '(пусто)')
  console.log('\nМожно тестировать анализ по фото в приложении (Загрузить фото).')
}

testKey().catch((err) => {
  console.error('❌ Ошибка:', err.message)
  process.exit(1)
})
