# Архитектура приложения "ЧтоЕсть"

## Обзор

Приложение построено на архитектуре клиент-сервер, где клиент - это React приложение, а "сервер" - это локальная SQLite база данных, работающая в браузере через WebAssembly (sql.js) или через Electron.

## Компоненты системы

### 1. Frontend (React + TypeScript)

#### Компоненты

**IngredientSelector**
- Отображает список доступных ингредиентов
- Позволяет выбирать несколько ингредиентов
- Поиск и фильтрация ингредиентов
- Визуальное отображение выбранных ингредиентов

**DishList**
- Получает выбранные ингредиенты
- Запрашивает подходящие блюда из БД
- Отображает 3-5 вариантов блюд
- Карточки блюд с изображением, названием, кратким описанием

**RecipeView**
- Отображает полный рецепт выбранного блюда
- Список ингредиентов с количествами
- Пошаговые инструкции
- Время приготовления, сложность, количество порций

**Layout**
- Навигация между экранами
- Общий layout приложения

#### State Management

Используется Redux Toolkit или Zustand для управления состоянием:
- Выбранные ингредиенты
- Список найденных блюд
- Текущий просматриваемый рецепт
- Состояние загрузки

### 2. База данных (SQLite)

#### Схема БД

**Таблица: ingredients**
- id (INTEGER PRIMARY KEY)
- name (TEXT UNIQUE) - название ингредиента
- category (TEXT) - категория (мясо, крупы, овощи и т.д.)
- image_url (TEXT) - путь к изображению

**Таблица: dishes**
- id (INTEGER PRIMARY KEY)
- name (TEXT) - название блюда
- description (TEXT) - краткое описание
- image_url (TEXT) - путь к изображению
- cooking_time (INTEGER) - время приготовления в минутах
- difficulty (TEXT) - сложность (легко, средне, сложно)
- servings (INTEGER) - количество порций

**Таблица: dish_ingredients** (связь многие-ко-многим)
- dish_id (INTEGER) - ID блюда
- ingredient_id (INTEGER) - ID ингредиента
- FOREIGN KEY constraints

**Таблица: recipes**
- id (INTEGER PRIMARY KEY)
- dish_id (INTEGER) - ID блюда
- instructions (TEXT) - пошаговые инструкции (JSON)
- FOREIGN KEY constraint

**Таблица: recipe_ingredients** (детали ингредиентов для рецепта)
- recipe_id (INTEGER) - ID рецепта
- ingredient_id (INTEGER) - ID ингредиента
- quantity (REAL) - количество
- unit (TEXT) - единица измерения (г, мл, шт и т.д.)
- FOREIGN KEY constraints

### 3. Сервисный слой

#### Database Service
- Инициализация БД
- Выполнение SQL запросов
- Управление соединением

#### Ingredients Service
- Получение всех ингредиентов
- Поиск ингредиентов
- Получение ингредиентов по категориям

#### Dishes Service
- Поиск блюд по ингредиентам
- Получение блюда по ID
- Фильтрация блюд

#### Recipes Service
- Получение рецепта по ID блюда
- Получение списка ингредиентов для рецепта

## Поток данных

1. **Выбор ингредиентов**
   ```
   User → IngredientSelector → Redux Store → UI Update
   ```

2. **Поиск блюд**
   ```
   User clicks "Найти блюда" → 
   Dishes Service → SQL Query → 
   Database → Results → 
   Redux Store → DishList Component
   ```

3. **Просмотр рецепта**
   ```
   User selects dish → 
   Recipe Service → SQL Query → 
   Database → Recipe data → 
   Redux Store → RecipeView Component
   ```

## Алгоритм поиска блюд

При выборе ингредиентов приложение ищет блюда, которые:
1. Содержат ВСЕ выбранные ингредиенты (точное совпадение)
2. Или содержат БОЛЬШИНСТВО выбранных ингредиентов (частичное совпадение)

SQL запрос:
```sql
SELECT d.*, COUNT(di.ingredient_id) as match_count
FROM dishes d
JOIN dish_ingredients di ON d.id = di.dish_id
WHERE di.ingredient_id IN (?, ?, ...)
GROUP BY d.id
HAVING match_count >= ?
ORDER BY match_count DESC, d.name
LIMIT 5
```

## Технические детали

### Работа с SQLite в браузере

**Вариант 1: sql.js (WebAssembly)**
- SQLite компилируется в WebAssembly
- Работает полностью в браузере
- БД хранится в IndexedDB или localStorage

**Вариант 2: Electron**
- Нативное приложение
- Использует sqlite3 модуль Node.js
- БД хранится в файловой системе

**Вариант 3: Tauri**
- Легковесная альтернатива Electron
- Rust backend с SQLite

### Хранение изображений

- Изображения хранятся локально в папке `public/images/`
- Пути к изображениям сохраняются в БД
- Для продакшена можно использовать base64 в БД

## Безопасность

- Все данные хранятся локально
- Нет сетевых запросов
- SQL injection защита через параметризованные запросы
- Валидация входных данных на клиенте

## Производительность

- Индексы на часто используемых полях
- Кэширование результатов запросов
- Ленивая загрузка изображений
- Виртуализация списков при большом количестве элементов

