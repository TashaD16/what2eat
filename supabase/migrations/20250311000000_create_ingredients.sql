-- Ингредиенты для выбора в приложении (перенесено из локальной SQLite)
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('meat', 'cereals', 'vegetables', 'dairy', 'spices', 'other')),
  image_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ingredients_select_all" ON ingredients;
CREATE POLICY "ingredients_select_all" ON ingredients FOR SELECT TO anon, authenticated USING (true);

-- Начальные данные (те же, что в seed.sql)
INSERT INTO ingredients (name, category, image_url) VALUES
('Курица', 'meat', '/images/ingredients/chicken.jpg'),
('Говядина', 'meat', '/images/ingredients/beef.jpg'),
('Свинина', 'meat', '/images/ingredients/pork.jpg'),
('Макароны', 'cereals', '/images/ingredients/pasta.jpg'),
('Гречка', 'cereals', '/images/ingredients/buckwheat.jpg'),
('Рис', 'cereals', '/images/ingredients/rice.jpg'),
('Овсянка', 'cereals', '/images/ingredients/oatmeal.jpg'),
('Лук', 'vegetables', '/images/ingredients/onion.jpg'),
('Морковь', 'vegetables', '/images/ingredients/carrot.jpg'),
('Помидоры', 'vegetables', '/images/ingredients/tomatoes.jpg'),
('Картофель', 'vegetables', '/images/ingredients/potato.jpg'),
('Перец болгарский', 'vegetables', '/images/ingredients/bell-pepper.jpg'),
('Чеснок', 'vegetables', '/images/ingredients/garlic.jpg'),
('Огурцы', 'vegetables', '/images/ingredients/cucumber.jpg'),
('Капуста', 'vegetables', '/images/ingredients/cabbage.jpg'),
('Кабачки', 'vegetables', '/images/ingredients/zucchini.jpg'),
('Баклажаны', 'vegetables', '/images/ingredients/eggplant.jpg'),
('Свекла', 'vegetables', '/images/ingredients/beetroot.jpg'),
('Редис', 'vegetables', '/images/ingredients/radish.jpg'),
('Укроп', 'vegetables', '/images/ingredients/dill.jpg'),
('Петрушка', 'vegetables', '/images/ingredients/parsley.jpg'),
('Шпинат', 'vegetables', '/images/ingredients/spinach.jpg'),
('Брокколи', 'vegetables', '/images/ingredients/broccoli.jpg'),
('Цветная капуста', 'vegetables', '/images/ingredients/cauliflower.jpg'),
('Лук зеленый', 'vegetables', '/images/ingredients/green-onion.jpg'),
('Сельдерей', 'vegetables', '/images/ingredients/celery.jpg'),
('Тыква', 'vegetables', '/images/ingredients/pumpkin.jpg'),
('Молоко', 'dairy', '/images/ingredients/milk.jpg'),
('Сыр', 'dairy', '/images/ingredients/cheese.jpg'),
('Сметана', 'dairy', '/images/ingredients/sour-cream.jpg'),
('Яйца', 'dairy', '/images/ingredients/eggs.jpg'),
('Соль', 'spices', '/images/ingredients/salt.jpg'),
('Перец черный', 'spices', '/images/ingredients/black-pepper.jpg'),
('Масло растительное', 'other', '/images/ingredients/vegetable-oil.jpg'),
('Масло сливочное', 'dairy', '/images/ingredients/butter.jpg'),
('Фарш', 'meat', '/images/ingredients/minced-meat.jpg'),
('Сосиски', 'meat', '/images/ingredients/sausages.jpg')
ON CONFLICT (name) DO NOTHING;
