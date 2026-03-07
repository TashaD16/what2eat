# Структура данных приложения "ЧтоЕсть"

## База данных SQLite

### Таблица: ingredients

Хранит информацию об ингредиентах.

| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PRIMARY KEY | Уникальный идентификатор |
| name | TEXT UNIQUE | Название ингредиента (например, "Макароны", "Курица") |
| category | TEXT | Категория ингредиента |
| image_url | TEXT | Путь к изображению ингредиента |

**Категории ингредиентов:**
- `meat` - Мясо (курица, говядина, свинина и т.д.)
- `cereals` - Крупы (гречка, рис, макароны и т.д.)
- `vegetables` - Овощи
- `dairy` - Молочные продукты
- `spices` - Специи и приправы
- `other` - Прочее

### Таблица: dishes

Хранит информацию о блюдах.

| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PRIMARY KEY | Уникальный идентификатор |
| name | TEXT | Название блюда |
| description | TEXT | Краткое описание блюда |
| image_url | TEXT | Путь к изображению блюда |
| cooking_time | INTEGER | Время приготовления в минутах |
| difficulty | TEXT | Сложность: "easy", "medium", "hard" |
| servings | INTEGER | Количество порций |

### Таблица: dish_ingredients

Связующая таблица между блюдами и ингредиентами (многие-ко-многим).

| Поле | Тип | Описание |
|------|-----|----------|
| dish_id | INTEGER | ID блюда (FOREIGN KEY) |
| ingredient_id | INTEGER | ID ингредиента (FOREIGN KEY) |

**Индексы:**
- PRIMARY KEY (dish_id, ingredient_id)
- INDEX idx_dish_id (dish_id)
- INDEX idx_ingredient_id (ingredient_id)

### Таблица: recipes

Хранит рецепты блюд.

| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PRIMARY KEY | Уникальный идентификатор |
| dish_id | INTEGER | ID блюда (FOREIGN KEY, UNIQUE) |
| instructions | TEXT | Пошаговые инструкции в формате JSON |

**Формат instructions (JSON):**
```json
[
  {
    "step": 1,
    "description": "Нарезать курицу кубиками"
  },
  {
    "step": 2,
    "description": "Обжарить на сковороде"
  }
]
```

### Таблица: recipe_ingredients

Детальная информация об ингредиентах для конкретного рецепта.

| Поле | Тип | Описание |
|------|-----|----------|
| recipe_id | INTEGER | ID рецепта (FOREIGN KEY) |
| ingredient_id | INTEGER | ID ингредиента (FOREIGN KEY) |
| quantity | REAL | Количество |
| unit | TEXT | Единица измерения (г, мл, шт, ст.л., ч.л. и т.д.) |

**Индексы:**
- PRIMARY KEY (recipe_id, ingredient_id)
- INDEX idx_recipe_id (recipe_id)

## TypeScript типы

### Ingredient

```typescript
interface Ingredient {
  id: number;
  name: string;
  category: 'meat' | 'cereals' | 'vegetables' | 'dairy' | 'spices' | 'other';
  image_url: string;
}
```

### Dish

```typescript
interface Dish {
  id: number;
  name: string;
  description: string;
  image_url: string;
  cooking_time: number;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  ingredients?: Ingredient[]; // Опционально, для отображения
}
```

### RecipeStep

```typescript
interface RecipeStep {
  step: number;
  description: string;
}
```

### RecipeIngredient

```typescript
interface RecipeIngredient {
  ingredient_id: number;
  ingredient_name: string;
  quantity: number;
  unit: string;
}
```

### Recipe

```typescript
interface Recipe {
  id: number;
  dish_id: number;
  dish_name: string;
  instructions: RecipeStep[];
  ingredients: RecipeIngredient[];
  cooking_time: number;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
}
```

## Примеры данных

### Ингредиенты

```sql
INSERT INTO ingredients (name, category, image_url) VALUES
('Курица', 'meat', '/images/ingredients/chicken.jpg'),
('Макароны', 'cereals', '/images/ingredients/pasta.jpg'),
('Гречка', 'cereals', '/images/ingredients/buckwheat.jpg'),
('Лук', 'vegetables', '/images/ingredients/onion.jpg'),
('Морковь', 'vegetables', '/images/ingredients/carrot.jpg'),
('Помидоры', 'vegetables', '/images/ingredients/tomatoes.jpg');
```

### Блюда

```sql
INSERT INTO dishes (name, description, image_url, cooking_time, difficulty, servings) VALUES
('Макароны с курицей', 'Сытное блюдо из макарон и курицы', '/images/dishes/pasta-chicken.jpg', 30, 'easy', 4),
('Гречка с курицей', 'Классическое блюдо русской кухни', '/images/dishes/buckwheat-chicken.jpg', 40, 'easy', 4),
('Куриный суп', 'Ароматный суп с курицей и овощами', '/images/dishes/chicken-soup.jpg', 60, 'medium', 6);
```

### Связи блюд и ингредиентов

```sql
-- Макароны с курицей
INSERT INTO dish_ingredients (dish_id, ingredient_id) VALUES
(1, 1), -- Курица
(1, 2), -- Макароны
(1, 4); -- Лук

-- Гречка с курицей
INSERT INTO dish_ingredients (dish_id, ingredient_id) VALUES
(2, 1), -- Курица
(2, 3), -- Гречка
(2, 4), -- Лук
(2, 5); -- Морковь
```

### Рецепты

```sql
INSERT INTO recipes (dish_id, instructions) VALUES
(1, '[
  {"step": 1, "description": "Нарезать курицу кубиками"},
  {"step": 2, "description": "Обжарить курицу на сковороде до золотистого цвета"},
  {"step": 3, "description": "Отварить макароны согласно инструкции на упаковке"},
  {"step": 4, "description": "Смешать макароны с курицей и подавать"}
]');
```

### Ингредиенты для рецепта

```sql
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(1, 1, 500, 'г'),  -- Курица 500г
(1, 2, 300, 'г'),  -- Макароны 300г
(1, 4, 1, 'шт');   -- Лук 1 шт
```

## Запросы для поиска блюд

### Поиск блюд по ингредиентам (точное совпадение)

```sql
SELECT d.*, COUNT(di.ingredient_id) as match_count
FROM dishes d
JOIN dish_ingredients di ON d.id = di.dish_id
WHERE di.ingredient_id IN (1, 2)  -- Выбранные ингредиенты
GROUP BY d.id
HAVING match_count = 2  -- Все ингредиенты должны совпадать
ORDER BY d.name;
```

### Поиск блюд по ингредиентам (частичное совпадение)

```sql
SELECT d.*, COUNT(di.ingredient_id) as match_count,
       (SELECT COUNT(*) FROM dish_ingredients WHERE dish_id = d.id) as total_ingredients
FROM dishes d
JOIN dish_ingredients di ON d.id = di.dish_id
WHERE di.ingredient_id IN (1, 2, 3)  -- Выбранные ингредиенты
GROUP BY d.id
HAVING match_count >= 2  -- Минимум 2 совпадения
ORDER BY match_count DESC, d.name
LIMIT 5;
```

### Получение полного рецепта

```sql
SELECT 
  r.id,
  r.dish_id,
  d.name as dish_name,
  r.instructions,
  d.cooking_time,
  d.difficulty,
  d.servings
FROM recipes r
JOIN dishes d ON r.dish_id = d.id
WHERE r.dish_id = ?;
```

### Получение ингредиентов рецепта

```sql
SELECT 
  ri.ingredient_id,
  i.name as ingredient_name,
  ri.quantity,
  ri.unit
FROM recipe_ingredients ri
JOIN ingredients i ON ri.ingredient_id = i.id
WHERE ri.recipe_id = ?;
```

