# Руководство по разработке

## Начало работы

### Требования

- Node.js 18+ 
- npm или yarn
- Git

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

```bash
npm run dev
```

### Сборка для продакшена

```bash
npm run build
```

## Структура проекта

```
ЧтоЕсть/
├── src/
│   ├── components/          # React компоненты
│   │   ├── IngredientSelector/
│   │   │   ├── IngredientSelector.tsx
│   │   │   ├── IngredientCard.tsx
│   │   │   └── index.ts
│   │   ├── DishList/
│   │   │   ├── DishList.tsx
│   │   │   ├── DishCard.tsx
│   │   │   └── index.ts
│   │   ├── RecipeView/
│   │   │   ├── RecipeView.tsx
│   │   │   ├── RecipeStep.tsx
│   │   │   ├── IngredientList.tsx
│   │   │   └── index.ts
│   │   └── Layout/
│   │       ├── Layout.tsx
│   │       ├── Header.tsx
│   │       └── index.ts
│   ├── services/            # Сервисы для работы с БД
│   │   ├── database.ts      # Инициализация и управление БД
│   │   ├── ingredients.ts   # CRUD операции для ингредиентов
│   │   ├── dishes.ts        # CRUD операции для блюд
│   │   └── recipes.ts       # CRUD операции для рецептов
│   ├── store/               # Redux store
│   │   ├── index.ts
│   │   ├── slices/
│   │   │   ├── ingredientsSlice.ts
│   │   │   ├── dishesSlice.ts
│   │   │   └── recipeSlice.ts
│   ├── types/               # TypeScript типы
│   │   ├── ingredient.ts
│   │   ├── dish.ts
│   │   └── recipe.ts
│   ├── hooks/               # Custom hooks
│   │   ├── useIngredients.ts
│   │   ├── useDishes.ts
│   │   └── useRecipe.ts
│   ├── utils/               # Утилиты
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── App.tsx
│   └── main.tsx
├── database/
│   ├── schema.sql
│   └── seed.sql
├── public/
│   └── images/
│       ├── ingredients/
│       └── dishes/
└── docs/
```

## Работа с базой данных

### Инициализация БД

База данных инициализируется при первом запуске приложения. Используется sql.js для работы с SQLite в браузере.

```typescript
// services/database.ts
import initSqlJs from 'sql.js';

export async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`
  });
  
  // Загрузка схемы и начальных данных
  // ...
}
```

### Выполнение запросов

Все запросы должны использовать параметризованные запросы для защиты от SQL injection:

```typescript
const stmt = db.prepare('SELECT * FROM dishes WHERE id = ?');
stmt.bind([dishId]);
const result = stmt.getAsObject();
```

## Компоненты

### IngredientSelector

Компонент для выбора ингредиентов.

**Props:**
- `selectedIngredients: number[]` - массив ID выбранных ингредиентов
- `onSelectionChange: (ids: number[]) => void` - callback при изменении выбора

**Функционал:**
- Отображение списка ингредиентов по категориям
- Поиск по названию
- Множественный выбор
- Визуальная индикация выбранных ингредиентов

### DishList

Компонент для отображения списка блюд.

**Props:**
- `ingredientIds: number[]` - ID выбранных ингредиентов
- `onDishSelect: (dishId: number) => void` - callback при выборе блюда

**Функционал:**
- Поиск блюд по ингредиентам
- Отображение 3-5 блюд
- Карточки с изображением, названием, описанием
- Индикация загрузки

### RecipeView

Компонент для отображения рецепта.

**Props:**
- `dishId: number` - ID блюда

**Функционал:**
- Отображение полного рецепта
- Список ингредиентов с количествами
- Пошаговые инструкции
- Информация о времени приготовления и сложности

## State Management

Используется Redux Toolkit для управления состоянием.

### Slices

**ingredientsSlice:**
- `ingredients: Ingredient[]` - список всех ингредиентов
- `selectedIngredients: number[]` - выбранные ингредиенты
- `loading: boolean` - состояние загрузки

**dishesSlice:**
- `dishes: Dish[]` - найденные блюда
- `loading: boolean` - состояние загрузки
- `error: string | null` - ошибка

**recipeSlice:**
- `currentRecipe: Recipe | null` - текущий рецепт
- `loading: boolean` - состояние загрузки
- `error: string | null` - ошибка

## Стилизация

Используется Material-UI или Tailwind CSS для стилизации компонентов.

### Тема

Определить цветовую схему и типографику в файле темы.

## Тестирование

### Unit тесты

Тесты для утилит и сервисов:

```bash
npm run test
```

### Компонентные тесты

Тесты для React компонентов с использованием React Testing Library.

## Линтинг и форматирование

```bash
npm run lint
npm run format
```

## Git workflow

1. Создать ветку для новой функции: `git checkout -b feature/ingredient-selector`
2. Внести изменения и закоммитить
3. Создать Pull Request
4. После ревью - смержить в main

## Деплой

Приложение может быть развернуто как:
- Статический сайт (Vercel, Netlify)
- Electron приложение
- PWA (Progressive Web App)

