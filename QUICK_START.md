# Быстрый старт

## Что было создано

### 📁 Структура проекта

```
ЧтоЕсть/
├── 📄 README.md                 # Основное описание проекта
├── 📄 PROJECT_PLAN.md           # План разработки
├── 📄 QUICK_START.md            # Этот файл
├── 📄 package.json              # Зависимости проекта
├── 📄 tsconfig.json             # Конфигурация TypeScript
├── 📄 vite.config.ts            # Конфигурация Vite
├── 📄 index.html                # HTML шаблон
│
├── 📁 docs/                     # Документация
│   ├── ARCHITECTURE.md          # Архитектура приложения
│   ├── DATA_STRUCTURE.md        # Структура данных
│   └── DEVELOPMENT.md           # Руководство по разработке
│
├── 📁 database/                 # База данных
│   ├── schema.sql               # Схема БД
│   └── seed.sql                 # Начальные данные
│
├── 📁 src/                      # Исходный код
│   ├── 📁 components/           # React компоненты
│   │   ├── IngredientSelector/  # Выбор ингредиентов
│   │   ├── DishList/            # Список блюд
│   │   ├── RecipeView/          # Просмотр рецепта
│   │   └── Layout/              # Общий layout
│   ├── 📁 services/             # Сервисы для работы с БД
│   ├── 📁 store/                # Redux store
│   │   └── slices/              # Redux slices
│   ├── 📁 types/                # TypeScript типы
│   ├── 📁 hooks/                # Custom React hooks
│   └── 📁 utils/                # Утилиты
│
└── 📁 public/                   # Статические файлы
    └── images/                  # Изображения
        ├── ingredients/         # Изображения ингредиентов
        └── dishes/              # Изображения блюд
```

## Следующие шаги

### 1. Установка зависимостей

```bash
npm install
```

### 2. Создание базовых файлов

Нужно создать следующие файлы для начала разработки:

**src/main.tsx** - точка входа приложения
**src/App.tsx** - главный компонент
**src/types/** - TypeScript типы
**src/services/database.ts** - инициализация БД
**src/store/index.ts** - настройка Redux

### 3. Запуск в режиме разработки

```bash
npm run dev
```

## Основные компоненты для реализации

1. **IngredientSelector** - выбор ингредиентов
2. **DishList** - список найденных блюд
3. **RecipeView** - просмотр рецепта
4. **Layout** - общий layout приложения

## База данных

База данных SQLite будет инициализирована при первом запуске приложения.

**Таблицы:**
- `ingredients` - ингредиенты
- `dishes` - блюда
- `dish_ingredients` - связь блюд и ингредиентов
- `recipes` - рецепты
- `recipe_ingredients` - ингредиенты рецептов с количествами

**Начальные данные:**
- 20 ингредиентов (мясо, крупы, овощи, молочные продукты, специи)
- 7 блюд с рецептами
- Связи между блюдами и ингредиентами

## Полезные команды

```bash
# Разработка
npm run dev

# Сборка
npm run build

# Предпросмотр сборки
npm run preview

# Линтинг
npm run lint

# Форматирование
npm run format
```

## Документация

- **README.md** - общее описание проекта
- **docs/ARCHITECTURE.md** - детальная архитектура
- **docs/DATA_STRUCTURE.md** - структура данных и примеры запросов
- **docs/DEVELOPMENT.md** - руководство по разработке
- **PROJECT_PLAN.md** - план разработки по этапам

## Технологии

- React 18 + TypeScript
- Material-UI для UI компонентов
- Redux Toolkit для state management
- SQLite (sql.js) для локальной БД
- Vite для сборки

## Контакты и поддержка

Для вопросов по проекту обращайтесь к документации в папке `docs/`.

