-- Схема базы данных для приложения "ЧтоЕсть"

-- Таблица ингредиентов
CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('meat', 'cereals', 'vegetables', 'dairy', 'spices', 'other')),
    image_url TEXT
);

-- Таблица блюд
CREATE TABLE IF NOT EXISTS dishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    cooking_time INTEGER NOT NULL, -- в минутах
    difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
    servings INTEGER NOT NULL DEFAULT 4,
    estimated_cost REAL,            -- примерная стоимость в $
    is_vegetarian INTEGER DEFAULT 0, -- 1 если вегетарианское
    is_vegan INTEGER DEFAULT 0,      -- 1 если веганское
    cuisine TEXT DEFAULT 'russian'   -- кухня: russian, italian, asian, american, other
);

-- Связующая таблица блюд и ингредиентов (многие-ко-многим)
CREATE TABLE IF NOT EXISTS dish_ingredients (
    dish_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    PRIMARY KEY (dish_id, ingredient_id),
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

-- Таблица рецептов
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dish_id INTEGER NOT NULL UNIQUE,
    instructions TEXT NOT NULL, -- JSON массив с пошаговыми инструкциями
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
);

-- Таблица ингредиентов для рецептов (с количеством)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    recipe_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL, -- г, мл, шт, ст.л., ч.л. и т.д.
    PRIMARY KEY (recipe_id, ingredient_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_dish_ingredients_dish_id ON dish_ingredients(dish_id);
CREATE INDEX IF NOT EXISTS idx_dish_ingredients_ingredient_id ON dish_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_dishes_difficulty ON dishes(difficulty);

