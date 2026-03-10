# Синхронизация рецептов в Supabase

Этот скрипт сохраняет все рецепты из `database/recipes-seed.sql` в Supabase для общего доступа.

## Подготовка

### 1. Получите Service Role Key

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Выберите проект: `siaaptnnchaafzygxugc`
3. Перейдите в **Settings → API**
4. Найдите **service_role** ключ (секретный)
5. Скопируйте его

### 2. Добавьте ключ в .env

Добавьте в файл `.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_ключ_здесь
```

⚠️ **Важно:** Service Role Key обходит все RLS политики. Не коммитьте его в git!

### 3. Создайте таблицу в Supabase

Выполните SQL из файла `scripts/supabase-global-recipes.sql` в Supabase Dashboard:

1. Откройте **SQL Editor** в Supabase Dashboard
2. Создайте новый запрос
3. Скопируйте содержимое `scripts/supabase-global-recipes.sql`
4. Выполните запрос (Run)

## Запуск

```bash
node scripts/sync-recipes-to-supabase.mjs
```

## Что делает скрипт

1. **Читает SQL файл** — парсит `database/recipes-seed.sql`
2. **Извлекает данные** — рецепты, ингредиенты, инструкции
3. **Проверяет таблицу** — убеждается, что `global_recipes` существует
4. **Сохраняет в Supabase** — загружает все рецепты батчами по 10

## Результат

После выполнения все рецепты будут доступны в Supabase в таблице `global_recipes`:
- Названия блюд
- Описания
- Фото (URL из TheMealDB)
- Ингредиенты с количеством
- Пошаговые инструкции
- Время приготовления и сложность

## Использование в приложении

После синхронизации можно получать рецепты из Supabase:

```typescript
const { data } = await supabase
  .from('global_recipes')
  .select('*')
  .limit(20)
```

## Устранение проблем

### Ошибка: SUPABASE_SERVICE_ROLE_KEY не найден
- Проверьте, что ключ добавлен в `.env`
- Убедитесь, что ключ скопирован полностью (без пробелов)

### Ошибка: Таблица global_recipes не существует
- Выполните SQL из `scripts/supabase-global-recipes.sql` в Supabase Dashboard
- Проверьте, что таблица создана: Table Editor → global_recipes

### Ошибка: Permission denied
- Убедитесь, что используете service_role ключ (не anon key)
- Проверьте RLS политики в Supabase Dashboard
