import initSqlJs, { Database } from 'sql.js'

let db: Database | null = null
let initPromise: Promise<Database> | null = null

export async function initDatabase(): Promise<Database> {
  if (db) {
    return db
  }
  if (initPromise) {
    return initPromise
  }
  initPromise = _doInit()
  return initPromise
}

async function _doInit(): Promise<Database> {

  // wasm-файл всегда берём локально из public/ (работает и на localhost, и на 127.0.0.1, и в продакшене)
  const SQL = await Promise.race([
    initSqlJs({
      locateFile: (file) => `/${file}`,
    }),
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout loading sql.js')), 30000)
    )
  ])

  db = new SQL.Database()

  // Загружаем схему
  try {
    console.log('Loading schema...')
    const schemaResponse = await fetch('/database/schema.sql', {
      cache: 'no-cache',
    })
    if (!schemaResponse.ok) {
      throw new Error(`Failed to load schema.sql: ${schemaResponse.status} ${schemaResponse.statusText}`)
    }
    const schema = await schemaResponse.text()
    console.log('Schema loaded, executing...')
    // Выполняем SQL построчно для лучшей обработки ошибок
    const statements = schema.split(';').filter(s => s.trim().length > 0)
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          db.run(statement)
        } catch (err) {
          const e = (err as { message?: string })
          // Игнорируем некоторые ошибки (например, IF NOT EXISTS)
          if (!e?.message?.includes('already exists') && !e?.message?.includes('duplicate')) {
            console.warn('SQL statement warning:', statement.substring(0, 50), e)
          }
        }
      }
    }
    console.log('Schema executed successfully')
  } catch (error) {
    console.error('Error loading schema:', error)
    throw error
  }

  // Загружаем начальные данные
  try {
    console.log('Loading seed data...')
    const seedResponse = await fetch('/database/seed.sql', {
      cache: 'no-cache',
    })
    if (!seedResponse.ok) {
      throw new Error(`Failed to load seed.sql: ${seedResponse.status} ${seedResponse.statusText}`)
    }
    const seed = await seedResponse.text()
    console.log('Seed data loaded, executing...')
    // Выполняем SQL построчно для лучшей обработки ошибок
    const statements = seed.split(';').filter(s => s.trim().length > 0)
    let executedCount = 0
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          db.run(statement)
          executedCount++
        } catch (err) {
          const e = (err as { message?: string })
          // Игнорируем ошибки INSERT OR IGNORE (UNIQUE constraint)
          if (!e?.message?.includes('UNIQUE constraint') && !e?.message?.includes('duplicate')) {
            console.warn('SQL statement warning:', statement.substring(0, 50), e?.message)
          }
        }
      }
    }
    console.log(`Seed data executed: ${executedCount} statements`)
  } catch (error) {
    console.error('Error loading seed data:', error)
    throw error
  }

  return db
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

