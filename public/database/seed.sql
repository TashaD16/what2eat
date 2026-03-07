-- Начальные данные для базы данных "ЧтоЕсть"

-- Ингредиенты
INSERT OR IGNORE INTO ingredients (name, category, image_url) VALUES
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
('Сосиски', 'meat', '/images/ingredients/sausages.jpg');

-- Блюда
INSERT OR IGNORE INTO dishes (name, description, image_url, cooking_time, difficulty, servings, estimated_cost, is_vegetarian, is_vegan) VALUES
('Макароны с курицей', 'Сытное и простое блюдо из макарон и курицы', '/images/dishes/pasta-chicken.jpg', 30, 'easy', 4, 8.00, 0, 0),
('Гречка с курицей', 'Классическое блюдо русской кухни', '/images/dishes/buckwheat-chicken.jpg', 40, 'easy', 4, 8.00, 0, 0),
('Рис с курицей', 'Вкусное блюдо из риса и курицы', '/images/dishes/rice-chicken.jpg', 35, 'easy', 4, 8.00, 0, 0),
('Макароны по-флотски', 'Макароны с говяжьим фаршем', '/images/dishes/pasta-beef.jpg', 25, 'easy', 4, 9.00, 0, 0),
('Гречневая каша с мясом', 'Сытная гречка с говядиной', '/images/dishes/buckwheat-beef.jpg', 50, 'medium', 4, 10.00, 0, 0),
('Картофель с курицей', 'Запеченный картофель с курицей', '/images/dishes/potato-chicken.jpg', 45, 'easy', 4, 9.00, 0, 0),
('Макароны с говядиной', 'Макароны с тушеной говядиной', '/images/dishes/pasta-beef-stew.jpg', 45, 'medium', 4, 11.00, 0, 0),
('Макароны со свининой', 'Макароны с обжаренной свининой', '/images/dishes/pasta-pork.jpg', 35, 'easy', 4, 10.00, 0, 0),
('Рис с говядиной', 'Рис с тушеной говядиной', '/images/dishes/rice-beef.jpg', 50, 'medium', 4, 11.00, 0, 0),
('Рис со свининой', 'Рис с обжаренной свининой', '/images/dishes/rice-pork.jpg', 40, 'easy', 4, 10.00, 0, 0),
('Гречка со свининой', 'Гречка с обжаренной свининой', '/images/dishes/buckwheat-pork.jpg', 45, 'easy', 4, 10.00, 0, 0),
('Овсянка с курицей', 'Овсяная каша с курицей', '/images/dishes/oatmeal-chicken.jpg', 30, 'easy', 4, 7.00, 0, 0),
('Овсянка с говядиной', 'Овсяная каша с говядиной', '/images/dishes/oatmeal-beef.jpg', 40, 'medium', 4, 9.00, 0, 0),
('Овсянка со свининой', 'Овсяная каша со свининой', '/images/dishes/oatmeal-pork.jpg', 35, 'easy', 4, 8.00, 0, 0),
('Картофель с говядиной', 'Запеченный картофель с говядиной', '/images/dishes/potato-beef.jpg', 55, 'medium', 4, 12.00, 0, 0),
('Картофель со свининой', 'Запеченный картофель со свининой', '/images/dishes/potato-pork.jpg', 50, 'easy', 4, 10.00, 0, 0),
('Макароны с яичницей', 'Макароны с жареными яйцами', '/images/dishes/pasta-scrambled-eggs.jpg', 20, 'easy', 4, 4.00, 1, 0),
('Гречка с яичницей', 'Гречка с жареными яйцами', '/images/dishes/buckwheat-scrambled-eggs.jpg', 25, 'easy', 4, 4.00, 1, 0),
('Рис с яичницей', 'Рис с жареными яйцами', '/images/dishes/rice-scrambled-eggs.jpg', 25, 'easy', 4, 4.00, 1, 0),
('Картофель с яичницей', 'Картофель с жареными яйцами', '/images/dishes/potato-scrambled-eggs.jpg', 30, 'easy', 4, 4.00, 1, 0),
('Макароны с вареными яйцами', 'Макароны с вареными яйцами', '/images/dishes/pasta-boiled-eggs.jpg', 20, 'easy', 4, 3.00, 1, 0),
('Гречка с вареными яйцами', 'Гречка с вареными яйцами', '/images/dishes/buckwheat-boiled-eggs.jpg', 30, 'easy', 4, 3.00, 1, 0),
('Рис с вареными яйцами', 'Рис с вареными яйцами', '/images/dishes/rice-boiled-eggs.jpg', 30, 'easy', 4, 3.00, 1, 0),
('Картофель с вареными яйцами', 'Картофель с вареными яйцами', '/images/dishes/potato-boiled-eggs.jpg', 35, 'easy', 4, 4.00, 1, 0),
('Макароны с овощами', 'Макароны с помидорами, луком и морковью', '/images/dishes/pasta-vegetables.jpg', 25, 'easy', 4, 5.00, 1, 1),
('Гречка с овощами', 'Гречка с морковью, луком и помидорами', '/images/dishes/buckwheat-vegetables.jpg', 30, 'easy', 4, 4.00, 1, 1),
('Рис с овощами', 'Рис с морковью, луком и помидорами', '/images/dishes/rice-vegetables.jpg', 30, 'easy', 4, 4.00, 1, 1),
('Картофель с овощами', 'Запеченный картофель с овощами', '/images/dishes/potato-vegetables.jpg', 40, 'easy', 4, 4.00, 1, 1),
('Макароны с сыром', 'Макароны с тертым сыром', '/images/dishes/pasta-cheese.jpg', 20, 'easy', 4, 5.00, 1, 0),
('Гречка с грибами и луком', 'Гречка с обжаренными грибами и луком', '/images/dishes/buckwheat-mushrooms.jpg', 35, 'easy', 4, 4.00, 1, 1),
('Рис с курицей и овощами', 'Рис с курицей, морковью и луком', '/images/dishes/rice-chicken-vegetables.jpg', 40, 'easy', 4, 9.00, 0, 0),
('Картофель с курицей и овощами', 'Запеченный картофель с курицей и овощами', '/images/dishes/potato-chicken-vegetables.jpg', 50, 'medium', 4, 10.00, 0, 0),
('Овсяная каша с молоком', 'Классическая овсяная каша на молоке', '/images/dishes/oatmeal-milk.jpg', 15, 'easy', 2, 2.00, 1, 0),
('Котлеты из фарша', 'Классические котлеты из мясного фарша', '/images/dishes/meatballs.jpg', 30, 'easy', 4, 9.00, 0, 0),
('Макароны с сосисками', 'Простое и сытное блюдо из макарон и сосисок', '/images/dishes/pasta-sausages.jpg', 20, 'easy', 4, 6.00, 0, 0),
('Сосиски с картофелем', 'Жареные сосиски с картофелем', '/images/dishes/potato-sausages.jpg', 30, 'easy', 4, 7.00, 0, 0),
('Сосиски с гречкой', 'Гречка с жареными сосисками', '/images/dishes/buckwheat-sausages.jpg', 30, 'easy', 4, 7.00, 0, 0),
('Сосиски с рисом', 'Рис с жареными сосисками', '/images/dishes/rice-sausages.jpg', 30, 'easy', 4, 7.00, 0, 0),
('Фарш с макаронами', 'Макароны с мясным фаршем и луком', '/images/dishes/pasta-minced-meat.jpg', 25, 'easy', 4, 8.00, 0, 0),
('Фарш с картофелем', 'Жареный фарш с картофелем', '/images/dishes/potato-minced-meat.jpg', 35, 'easy', 4, 8.00, 0, 0);

-- Связи блюд и ингредиентов
-- Макароны с курицей (id=1)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(1, 1), -- Курица
(1, 4), -- Макароны
(1, 8), -- Лук
(1, 19); -- Масло растительное

-- Гречка с курицей (id=2)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(2, 1), -- Курица
(2, 5), -- Гречка
(2, 8), -- Лук
(2, 9), -- Морковь
(2, 19); -- Масло растительное

-- Рис с курицей (id=3)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(3, 1), -- Курица
(3, 6), -- Рис
(3, 8), -- Лук
(3, 9), -- Морковь
(3, 19); -- Масло растительное

-- Макароны по-флотски (id=4)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(4, 2), -- Говядина
(4, 4), -- Макароны
(4, 8), -- Лук
(4, 19); -- Масло растительное

-- Гречневая каша с мясом (id=5)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(5, 2), -- Говядина
(5, 5), -- Гречка
(5, 8), -- Лук
(5, 9), -- Морковь
(5, 19); -- Масло растительное

-- Картофель с курицей (id=6)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(6, 1), -- Курица
(6, 11), -- Картофель
(6, 8), -- Лук
(6, 13), -- Чеснок
(6, 19); -- Масло растительное

-- Макароны с говядиной (id=7)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(7, 2), -- Говядина
(7, 4), -- Макароны
(7, 8), -- Лук
(7, 9), -- Морковь
(7, 19); -- Масло растительное

-- Макароны со свининой (id=8)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(8, 3), -- Свинина
(8, 4), -- Макароны
(8, 8), -- Лук
(8, 19); -- Масло растительное

-- Рис с говядиной (id=9)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(9, 2), -- Говядина
(9, 6), -- Рис
(9, 8), -- Лук
(9, 9), -- Морковь
(9, 19); -- Масло растительное

-- Рис со свининой (id=10)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(10, 3), -- Свинина
(10, 6), -- Рис
(10, 8), -- Лук
(10, 9), -- Морковь
(10, 19); -- Масло растительное

-- Гречка со свининой (id=11)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(11, 3), -- Свинина
(11, 5), -- Гречка
(11, 8), -- Лук
(11, 9), -- Морковь
(11, 19); -- Масло растительное

-- Овсянка с курицей (id=12)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(12, 1), -- Курица
(12, 7), -- Овсянка
(12, 8), -- Лук
(12, 19); -- Масло растительное

-- Овсянка с говядиной (id=13)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(13, 2), -- Говядина
(13, 7), -- Овсянка
(13, 8), -- Лук
(13, 9), -- Морковь
(13, 19); -- Масло растительное

-- Овсянка со свининой (id=14)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(14, 3), -- Свинина
(14, 7), -- Овсянка
(14, 8), -- Лук
(14, 19); -- Масло растительное

-- Картофель с говядиной (id=15)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(15, 2), -- Говядина
(15, 11), -- Картофель
(15, 8), -- Лук
(15, 13), -- Чеснок
(15, 19); -- Масло растительное

-- Картофель со свининой (id=16)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(16, 3), -- Свинина
(16, 11), -- Картофель
(16, 8), -- Лук
(16, 13), -- Чеснок
(16, 19); -- Масло растительное

-- Макароны с яичницей (id=17)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(17, 21), -- Яйца
(17, 4), -- Макароны
(17, 19); -- Масло растительное

-- Гречка с яичницей (id=18)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(18, 21), -- Яйца
(18, 5), -- Гречка
(18, 19); -- Масло растительное

-- Рис с яичницей (id=19)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(19, 21), -- Яйца
(19, 6), -- Рис
(19, 19); -- Масло растительное

-- Картофель с яичницей (id=20)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(20, 21), -- Яйца
(20, 11), -- Картофель
(20, 8), -- Лук
(20, 19); -- Масло растительное

-- Макароны с вареными яйцами (id=21)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(21, 21), -- Яйца
(21, 4); -- Макароны

-- Гречка с вареными яйцами (id=22)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(22, 21), -- Яйца
(22, 5); -- Гречка

-- Рис с вареными яйцами (id=23)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(23, 21), -- Яйца
(23, 6); -- Рис

-- Картофель с вареными яйцами (id=24)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(24, 21), -- Яйца
(24, 11); -- Картофель

-- Макароны с овощами (id=25)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(25, 4), -- Макароны
(25, 10), -- Помидоры
(25, 8), -- Лук
(25, 9), -- Морковь
(25, 19); -- Масло растительное

-- Гречка с овощами (id=26)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(26, 5), -- Гречка
(26, 9), -- Морковь
(26, 8), -- Лук
(26, 10), -- Помидоры
(26, 19); -- Масло растительное

-- Рис с овощами (id=27)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(27, 6), -- Рис
(27, 9), -- Морковь
(27, 8), -- Лук
(27, 10), -- Помидоры
(27, 19); -- Масло растительное

-- Картофель с овощами (id=28)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(28, 11), -- Картофель
(28, 9), -- Морковь
(28, 8), -- Лук
(28, 10), -- Помидоры
(28, 19); -- Масло растительное

-- Макароны с сыром (id=29)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(29, 4), -- Макароны
(29, 15); -- Сыр

-- Гречка с грибами и луком (id=30)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(30, 5), -- Гречка
(30, 8), -- Лук
(30, 19); -- Масло растительное

-- Рис с курицей и овощами (id=31)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(31, 6), -- Рис
(31, 1), -- Курица
(31, 9), -- Морковь
(31, 8), -- Лук
(31, 19); -- Масло растительное

-- Картофель с курицей и овощами (id=32)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(32, 11), -- Картофель
(32, 1), -- Курица
(32, 9), -- Морковь
(32, 8), -- Лук
(32, 19); -- Масло растительное

-- Овсяная каша с молоком (id=33)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(33, 7), -- Овсянка
(33, 32); -- Молоко

-- Котлеты из фарша (id=34)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(34, 40), -- Фарш
(34, 8), -- Лук
(34, 21), -- Яйца
(34, 19); -- Масло растительное

-- Макароны с сосисками (id=35)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(35, 4), -- Макароны
(35, 41), -- Сосиски
(35, 8), -- Лук
(35, 19); -- Масло растительное

-- Сосиски с картофелем (id=36)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(36, 41), -- Сосиски
(36, 11), -- Картофель
(36, 8), -- Лук
(36, 19); -- Масло растительное

-- Сосиски с гречкой (id=37)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(37, 41), -- Сосиски
(37, 5), -- Гречка
(37, 8), -- Лук
(37, 19); -- Масло растительное

-- Сосиски с рисом (id=38)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(38, 41), -- Сосиски
(38, 6), -- Рис
(38, 8), -- Лук
(38, 9), -- Морковь
(38, 19); -- Масло растительное

-- Фарш с макаронами (id=39)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(39, 40), -- Фарш
(39, 4), -- Макароны
(39, 8), -- Лук
(39, 19); -- Масло растительное

-- Фарш с картофелем (id=40)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(40, 40), -- Фарш
(40, 11), -- Картофель
(40, 8), -- Лук
(40, 9), -- Морковь
(40, 19); -- Масло растительное

-- Рецепты
INSERT OR IGNORE INTO recipes (dish_id, instructions) VALUES
(1, '[
  {"step": 1, "description": "Нарезать курицу кубиками среднего размера"},
  {"step": 2, "description": "Нарезать лук полукольцами"},
  {"step": 3, "description": "Разогреть сковороду с растительным маслом"},
  {"step": 4, "description": "Обжарить лук до прозрачности, затем добавить курицу"},
  {"step": 5, "description": "Обжарить курицу до золотистого цвета, посолить и поперчить"},
  {"step": 6, "description": "Отварить макароны согласно инструкции на упаковке"},
  {"step": 7, "description": "Смешать готовые макароны с курицей и подавать горячим"}
]'),

(2, '[
  {"step": 1, "description": "Промыть гречку и залить водой в соотношении 1:2"},
  {"step": 2, "description": "Нарезать курицу кубиками, лук и морковь"},
  {"step": 3, "description": "Обжарить лук и морковь на сковороде"},
  {"step": 4, "description": "Добавить курицу и обжарить до готовности"},
  {"step": 5, "description": "Варить гречку на медленном огне 20 минут"},
  {"step": 6, "description": "Смешать готовую гречку с курицей и овощами"},
  {"step": 7, "description": "Подавать горячим"}
]'),

(3, '[
  {"step": 1, "description": "Промыть рис и залить водой в соотношении 1:2"},
  {"step": 2, "description": "Нарезать курицу кубиками, лук и морковь"},
  {"step": 3, "description": "Обжарить лук и морковь на сковороде"},
  {"step": 4, "description": "Добавить курицу и обжарить до готовности"},
  {"step": 5, "description": "Варить рис на медленном огне 20 минут"},
  {"step": 6, "description": "Смешать готовый рис с курицей и овощами"},
  {"step": 7, "description": "Подавать горячим"}
]'),

(4, '[
  {"step": 1, "description": "Нарезать лук мелко"},
  {"step": 2, "description": "Обжарить лук на сковороде до золотистого цвета"},
  {"step": 3, "description": "Добавить мясной фарш и обжарить до готовности"},
  {"step": 4, "description": "Посолить и поперчить по вкусу"},
  {"step": 5, "description": "Отварить макароны согласно инструкции"},
  {"step": 6, "description": "Смешать макароны с фаршем и подавать"}
]'),

(5, '[
  {"step": 1, "description": "Промыть гречку и залить водой в соотношении 1:2"},
  {"step": 2, "description": "Нарезать говядину кубиками, лук и морковь"},
  {"step": 3, "description": "Обжарить мясо до образования корочки"},
  {"step": 4, "description": "Добавить лук и морковь, тушить 10 минут"},
  {"step": 5, "description": "Варить гречку на медленном огне 20 минут"},
  {"step": 6, "description": "Смешать готовую гречку с мясом и овощами"},
  {"step": 7, "description": "Тушить еще 5 минут и подавать"}
]'),

(6, '[
  {"step": 1, "description": "Нарезать картофель крупными кубиками"},
  {"step": 2, "description": "Нарезать курицу кубиками, лук и чеснок"},
  {"step": 3, "description": "Смешать все ингредиенты с растительным маслом"},
  {"step": 4, "description": "Посолить, поперчить, добавить специи"},
  {"step": 5, "description": "Выложить на противень и запекать при 200°C 35-40 минут"},
  {"step": 6, "description": "Подавать горячим"}
]'),

(7, '[
  {"step": 1, "description": "Нарезать говядину кубиками среднего размера"},
  {"step": 2, "description": "Нарезать лук и морковь"},
  {"step": 3, "description": "Обжарить говядину до образования корочки"},
  {"step": 4, "description": "Добавить лук и морковь, тушить 15 минут"},
  {"step": 5, "description": "Отварить макароны согласно инструкции на упаковке"},
  {"step": 6, "description": "Смешать готовые макароны с мясом и овощами"},
  {"step": 7, "description": "Подавать горячим"}
]'),

(8, '[
  {"step": 1, "description": "Нарезать свинину кубиками среднего размера"},
  {"step": 2, "description": "Нарезать лук полукольцами"},
  {"step": 3, "description": "Разогреть сковороду с растительным маслом"},
  {"step": 4, "description": "Обжарить лук до прозрачности, затем добавить свинину"},
  {"step": 5, "description": "Обжарить свинину до готовности, посолить и поперчить"},
  {"step": 6, "description": "Отварить макароны согласно инструкции на упаковке"},
  {"step": 7, "description": "Смешать готовые макароны со свининой и подавать горячим"}
]'),

(9, '[
  {"step": 1, "description": "Промыть рис и залить водой в соотношении 1:2"},
  {"step": 2, "description": "Нарезать говядину кубиками, лук и морковь"},
  {"step": 3, "description": "Обжарить говядину до образования корочки"},
  {"step": 4, "description": "Добавить лук и морковь, тушить 10 минут"},
  {"step": 5, "description": "Варить рис на медленном огне 20 минут"},
  {"step": 6, "description": "Смешать готовый рис с мясом и овощами"},
  {"step": 7, "description": "Тушить еще 5 минут и подавать"}
]'),

(10, '[
  {"step": 1, "description": "Промыть рис и залить водой в соотношении 1:2"},
  {"step": 2, "description": "Нарезать свинину кубиками, лук и морковь"},
  {"step": 3, "description": "Обжарить лук и морковь на сковороде"},
  {"step": 4, "description": "Добавить свинину и обжарить до готовности"},
  {"step": 5, "description": "Варить рис на медленном огне 20 минут"},
  {"step": 6, "description": "Смешать готовый рис со свининой и овощами"},
  {"step": 7, "description": "Подавать горячим"}
]'),

(11, '[
  {"step": 1, "description": "Промыть гречку и залить водой в соотношении 1:2"},
  {"step": 2, "description": "Нарезать свинину кубиками, лук и морковь"},
  {"step": 3, "description": "Обжарить лук и морковь на сковороде"},
  {"step": 4, "description": "Добавить свинину и обжарить до готовности"},
  {"step": 5, "description": "Варить гречку на медленном огне 20 минут"},
  {"step": 6, "description": "Смешать готовую гречку со свининой и овощами"},
  {"step": 7, "description": "Подавать горячим"}
]'),

(12, '[
  {"step": 1, "description": "Залить овсянку водой или молоком в соотношении 1:2"},
  {"step": 2, "description": "Нарезать курицу кубиками, лук"},
  {"step": 3, "description": "Обжарить лук на сковороде"},
  {"step": 4, "description": "Добавить курицу и обжарить до готовности"},
  {"step": 5, "description": "Варить овсянку на медленном огне 10-15 минут"},
  {"step": 6, "description": "Смешать готовую овсянку с курицей и луком"},
  {"step": 7, "description": "Подавать горячим"}
]'),

(13, '[
  {"step": 1, "description": "Залить овсянку водой или молоком в соотношении 1:2"},
  {"step": 2, "description": "Нарезать говядину кубиками, лук и морковь"},
  {"step": 3, "description": "Обжарить мясо до образования корочки"},
  {"step": 4, "description": "Добавить лук и морковь, тушить 10 минут"},
  {"step": 5, "description": "Варить овсянку на медленном огне 10-15 минут"},
  {"step": 6, "description": "Смешать готовую овсянку с мясом и овощами"},
  {"step": 7, "description": "Подавать горячим"}
]'),

(14, '[
  {"step": 1, "description": "Залить овсянку водой или молоком в соотношении 1:2"},
  {"step": 2, "description": "Нарезать свинину кубиками, лук"},
  {"step": 3, "description": "Обжарить лук на сковороде"},
  {"step": 4, "description": "Добавить свинину и обжарить до готовности"},
  {"step": 5, "description": "Варить овсянку на медленном огне 10-15 минут"},
  {"step": 6, "description": "Смешать готовую овсянку со свининой и луком"},
  {"step": 7, "description": "Подавать горячим"}
]'),

(15, '[
  {"step": 1, "description": "Нарезать картофель крупными кубиками"},
  {"step": 2, "description": "Нарезать говядину кубиками, лук и чеснок"},
  {"step": 3, "description": "Обжарить говядину до образования корочки"},
  {"step": 4, "description": "Смешать картофель, мясо, лук и чеснок с растительным маслом"},
  {"step": 5, "description": "Посолить, поперчить, добавить специи"},
  {"step": 6, "description": "Выложить на противень и запекать при 200°C 45-50 минут"},
  {"step": 7, "description": "Подавать горячим"}
]'),

(16, '[
  {"step": 1, "description": "Нарезать картофель крупными кубиками"},
  {"step": 2, "description": "Нарезать свинину кубиками, лук и чеснок"},
  {"step": 3, "description": "Смешать все ингредиенты с растительным маслом"},
  {"step": 4, "description": "Посолить, поперчить, добавить специи"},
  {"step": 5, "description": "Выложить на противень и запекать при 200°C 40-45 минут"},
  {"step": 6, "description": "Подавать горячим"}
]'),

(17, '[
  {"step": 1, "description": "Отварить макароны согласно инструкции на упаковке"},
  {"step": 2, "description": "Разогреть сковороду с растительным маслом"},
  {"step": 3, "description": "Разбить яйца в миску, посолить и взбить вилкой"},
  {"step": 4, "description": "Вылить яйца на сковороду и жарить, помешивая, до готовности"},
  {"step": 5, "description": "Смешать готовые макароны с яичницей"},
  {"step": 6, "description": "Подавать горячим"}
]'),

(18, '[
  {"step": 1, "description": "Промыть гречку и залить водой в соотношении 1:2"},
  {"step": 2, "description": "Варить гречку на медленном огне 20 минут"},
  {"step": 3, "description": "Разогреть сковороду с растительным маслом"},
  {"step": 4, "description": "Разбить яйца в миску, посолить и взбить вилкой"},
  {"step": 5, "description": "Вылить яйца на сковороду и жарить, помешивая, до готовности"},
  {"step": 6, "description": "Смешать готовую гречку с яичницей и подавать"}
]'),

(19, '[
  {"step": 1, "description": "Промыть рис и залить водой в соотношении 1:2"},
  {"step": 2, "description": "Варить рис на медленном огне 20 минут"},
  {"step": 3, "description": "Разогреть сковороду с растительным маслом"},
  {"step": 4, "description": "Разбить яйца в миску, посолить и взбить вилкой"},
  {"step": 5, "description": "Вылить яйца на сковороду и жарить, помешивая, до готовности"},
  {"step": 6, "description": "Смешать готовый рис с яичницей и подавать"}
]'),

(20, '[
  {"step": 1, "description": "Отварить картофель в мундире или очищенный до готовности"},
  {"step": 2, "description": "Нарезать картофель кубиками, лук"},
  {"step": 3, "description": "Обжарить картофель с луком на сковороде"},
  {"step": 4, "description": "Разбить яйца в миску, посолить и взбить вилкой"},
  {"step": 5, "description": "Вылить яйца на картофель и жарить, помешивая, до готовности"},
  {"step": 6, "description": "Подавать горячим"}
]'),

(21, '[
  {"step": 1, "description": "Отварить яйца вкрутую (7-8 минут после закипания)"},
  {"step": 2, "description": "Охладить яйца в холодной воде и очистить"},
  {"step": 3, "description": "Отварить макароны согласно инструкции на упаковке"},
  {"step": 4, "description": "Нарезать яйца кубиками или дольками"},
  {"step": 5, "description": "Смешать макароны с яйцами"},
  {"step": 6, "description": "Подавать, можно добавить масло или сметану"}
]'),

(22, '[
  {"step": 1, "description": "Отварить яйца вкрутую (7-8 минут после закипания)"},
  {"step": 2, "description": "Охладить яйца в холодной воде и очистить"},
  {"step": 3, "description": "Промыть гречку и залить водой в соотношении 1:2"},
  {"step": 4, "description": "Варить гречку на медленном огне 20 минут"},
  {"step": 5, "description": "Нарезать яйца кубиками или дольками"},
  {"step": 6, "description": "Смешать готовую гречку с яйцами и подавать"}
]'),

(23, '[
  {"step": 1, "description": "Отварить яйца вкрутую (7-8 минут после закипания)"},
  {"step": 2, "description": "Охладить яйца в холодной воде и очистить"},
  {"step": 3, "description": "Промыть рис и залить водой в соотношении 1:2"},
  {"step": 4, "description": "Варить рис на медленном огне 20 минут"},
  {"step": 5, "description": "Нарезать яйца кубиками или дольками"},
  {"step": 6, "description": "Смешать готовый рис с яйцами и подавать"}
]'),

(24, '[
  {"step": 1, "description": "Отварить яйца вкрутую (7-8 минут после закипания)"},
  {"step": 2, "description": "Охладить яйца в холодной воде и очистить"},
  {"step": 3, "description": "Отварить картофель до готовности"},
  {"step": 4, "description": "Нарезать картофель кубиками"},
  {"step": 5, "description": "Нарезать яйца кубиками или дольками"},
  {"step": 6, "description": "Смешать картофель с яйцами, можно добавить масло или сметану"},
  {"step": 7, "description": "Подавать"}
]'),

(33, '[
  {"step": 1, "description": "Влить молоко в кастрюлю и довести до кипения"},
  {"step": 2, "description": "Добавить овсянку в кипящее молоко"},
  {"step": 3, "description": "Варить на медленном огне, помешивая, 10-15 минут"},
  {"step": 4, "description": "Добавить соль по вкусу"},
  {"step": 5, "description": "Подавать горячей, можно добавить масло"}
]'),

(34, '[
  {"step": 1, "description": "Нарезать лук мелко"},
  {"step": 2, "description": "Смешать фарш с луком, яйцом, солью и перцем"},
  {"step": 3, "description": "Хорошо вымесить фарш до однородной массы"},
  {"step": 4, "description": "Сформировать котлеты округлой формы"},
  {"step": 5, "description": "Разогреть сковороду с растительным маслом"},
  {"step": 6, "description": "Обжарить котлеты с обеих сторон до золотистой корочки"},
  {"step": 7, "description": "Уменьшить огонь и довести до готовности под крышкой 10-15 минут"},
  {"step": 8, "description": "Подавать горячими"}
]'),

(35, '[
  {"step": 1, "description": "Отварить макароны согласно инструкции на упаковке"},
  {"step": 2, "description": "Нарезать сосиски кружочками, лук полукольцами"},
  {"step": 3, "description": "Разогреть сковороду с растительным маслом"},
  {"step": 4, "description": "Обжарить лук до прозрачности"},
  {"step": 5, "description": "Добавить сосиски и обжарить до золотистого цвета"},
  {"step": 6, "description": "Посолить и поперчить по вкусу"},
  {"step": 7, "description": "Смешать готовые макароны с сосисками и луком"},
  {"step": 8, "description": "Подавать горячим"}
]'),

(36, '[
  {"step": 1, "description": "Очистить и нарезать картофель кубиками"},
  {"step": 2, "description": "Нарезать сосиски кружочками, лук полукольцами"},
  {"step": 3, "description": "Разогреть сковороду с растительным маслом"},
  {"step": 4, "description": "Обжарить картофель до золотистого цвета"},
  {"step": 5, "description": "Добавить лук и обжарить еще 5 минут"},
  {"step": 6, "description": "Добавить сосиски и обжарить все вместе 5-7 минут"},
  {"step": 7, "description": "Посолить и поперчить по вкусу"},
  {"step": 8, "description": "Подавать горячим"}
]'),

(37, '[
  {"step": 1, "description": "Промыть гречку и залить водой в соотношении 1:2"},
  {"step": 2, "description": "Варить гречку на медленном огне 20 минут"},
  {"step": 3, "description": "Нарезать сосиски кружочками, лук полукольцами"},
  {"step": 4, "description": "Разогреть сковороду с растительным маслом"},
  {"step": 5, "description": "Обжарить лук до прозрачности"},
  {"step": 6, "description": "Добавить сосиски и обжарить до золотистого цвета"},
  {"step": 7, "description": "Смешать готовую гречку с сосисками и луком"},
  {"step": 8, "description": "Посолить и поперчить по вкусу"},
  {"step": 9, "description": "Подавать горячим"}
]'),

(38, '[
  {"step": 1, "description": "Промыть рис и залить водой в соотношении 1:2"},
  {"step": 2, "description": "Варить рис на медленном огне 20 минут"},
  {"step": 3, "description": "Нарезать сосиски кружочками, лук и морковь"},
  {"step": 4, "description": "Разогреть сковороду с растительным маслом"},
  {"step": 5, "description": "Обжарить лук и морковь до мягкости"},
  {"step": 6, "description": "Добавить сосиски и обжарить до золотистого цвета"},
  {"step": 7, "description": "Смешать готовый рис с сосисками и овощами"},
  {"step": 8, "description": "Посолить и поперчить по вкусу"},
  {"step": 9, "description": "Подавать горячим"}
]'),

(39, '[
  {"step": 1, "description": "Нарезать лук мелко"},
  {"step": 2, "description": "Разогреть сковороду с растительным маслом"},
  {"step": 3, "description": "Обжарить лук до золотистого цвета"},
  {"step": 4, "description": "Добавить фарш и обжарить, разминая вилкой, до готовности"},
  {"step": 5, "description": "Посолить и поперчить по вкусу"},
  {"step": 6, "description": "Отварить макароны согласно инструкции на упаковке"},
  {"step": 7, "description": "Смешать готовые макароны с фаршем"},
  {"step": 8, "description": "Подавать горячим"}
]'),

(40, '[
  {"step": 1, "description": "Очистить и нарезать картофель кубиками"},
  {"step": 2, "description": "Нарезать лук и морковь"},
  {"step": 3, "description": "Разогреть сковороду с растительным маслом"},
  {"step": 4, "description": "Обжарить лук и морковь до мягкости"},
  {"step": 5, "description": "Добавить фарш и обжарить, разминая вилкой, до готовности"},
  {"step": 6, "description": "Добавить картофель и обжарить все вместе 10-15 минут"},
  {"step": 7, "description": "Налить немного воды, накрыть крышкой и тушить до готовности картофеля"},
  {"step": 8, "description": "Посолить и поперчить по вкусу"},
  {"step": 9, "description": "Подавать горячим"}
]');

-- Ингредиенты для рецептов (с количеством)
-- Макароны с курицей
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(1, 1, 500, 'г'),  -- Курица
(1, 4, 300, 'г'),  -- Макароны
(1, 8, 1, 'шт'),   -- Лук
(1, 19, 30, 'мл'), -- Масло растительное
(1, 17, 1, 'ч.л.'), -- Соль
(1, 18, 0.5, 'ч.л.'); -- Перец

-- Гречка с курицей
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(2, 1, 500, 'г'),  -- Курица
(2, 5, 200, 'г'),  -- Гречка
(2, 8, 1, 'шт'),   -- Лук
(2, 9, 1, 'шт'),   -- Морковь
(2, 19, 30, 'мл'), -- Масло растительное
(2, 17, 1, 'ч.л.'), -- Соль
(2, 18, 0.5, 'ч.л.'); -- Перец

-- Рис с курицей
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(3, 1, 500, 'г'),  -- Курица
(3, 6, 200, 'г'),  -- Рис
(3, 8, 1, 'шт'),   -- Лук
(3, 9, 1, 'шт'),   -- Морковь
(3, 19, 30, 'мл'), -- Масло растительное
(3, 17, 1, 'ч.л.'), -- Соль
(3, 18, 0.5, 'ч.л.'); -- Перец

-- Макароны по-флотски
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(4, 2, 400, 'г'),  -- Говядина (фарш)
(4, 4, 300, 'г'),  -- Макароны
(4, 8, 1, 'шт'),   -- Лук
(4, 19, 30, 'мл'), -- Масло растительное
(4, 17, 1, 'ч.л.'), -- Соль
(4, 18, 0.5, 'ч.л.'); -- Перец

-- Гречневая каша с мясом
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(5, 2, 500, 'г'),  -- Говядина
(5, 5, 200, 'г'),  -- Гречка
(5, 8, 1, 'шт'),   -- Лук
(5, 9, 1, 'шт'),   -- Морковь
(5, 19, 30, 'мл'), -- Масло растительное
(5, 17, 1, 'ч.л.'), -- Соль
(5, 18, 0.5, 'ч.л.'); -- Перец

-- Картофель с курицей
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(6, 1, 500, 'г'),  -- Курица
(6, 11, 800, 'г'), -- Картофель
(6, 8, 1, 'шт'),   -- Лук
(6, 13, 3, 'зуб'), -- Чеснок
(6, 19, 40, 'мл'), -- Масло растительное
(6, 17, 1, 'ч.л.'), -- Соль
(6, 18, 0.5, 'ч.л.'); -- Перец

-- Макароны с говядиной
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(7, 2, 500, 'г'),  -- Говядина
(7, 4, 300, 'г'),  -- Макароны
(7, 8, 1, 'шт'),   -- Лук
(7, 9, 1, 'шт'),   -- Морковь
(7, 19, 30, 'мл'), -- Масло растительное
(7, 17, 1, 'ч.л.'), -- Соль
(7, 18, 0.5, 'ч.л.'); -- Перец

-- Макароны со свининой
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(8, 3, 500, 'г'),  -- Свинина
(8, 4, 300, 'г'),  -- Макароны
(8, 8, 1, 'шт'),   -- Лук
(8, 19, 30, 'мл'), -- Масло растительное
(8, 17, 1, 'ч.л.'), -- Соль
(8, 18, 0.5, 'ч.л.'); -- Перец

-- Рис с говядиной
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(9, 2, 500, 'г'),  -- Говядина
(9, 6, 200, 'г'),  -- Рис
(9, 8, 1, 'шт'),   -- Лук
(9, 9, 1, 'шт'),   -- Морковь
(9, 19, 30, 'мл'), -- Масло растительное
(9, 17, 1, 'ч.л.'), -- Соль
(9, 18, 0.5, 'ч.л.'); -- Перец

-- Рис со свининой
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(10, 3, 500, 'г'),  -- Свинина
(10, 6, 200, 'г'),  -- Рис
(10, 8, 1, 'шт'),   -- Лук
(10, 9, 1, 'шт'),   -- Морковь
(10, 19, 30, 'мл'), -- Масло растительное
(10, 17, 1, 'ч.л.'), -- Соль
(10, 18, 0.5, 'ч.л.'); -- Перец

-- Гречка со свининой
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(11, 3, 500, 'г'),  -- Свинина
(11, 5, 200, 'г'),  -- Гречка
(11, 8, 1, 'шт'),   -- Лук
(11, 9, 1, 'шт'),   -- Морковь
(11, 19, 30, 'мл'), -- Масло растительное
(11, 17, 1, 'ч.л.'), -- Соль
(11, 18, 0.5, 'ч.л.'); -- Перец

-- Овсянка с курицей
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(12, 1, 500, 'г'),  -- Курица
(12, 7, 200, 'г'),  -- Овсянка
(12, 8, 1, 'шт'),   -- Лук
(12, 19, 30, 'мл'), -- Масло растительное
(12, 17, 1, 'ч.л.'), -- Соль
(12, 18, 0.5, 'ч.л.'); -- Перец

-- Овсянка с говядиной
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(13, 2, 500, 'г'),  -- Говядина
(13, 7, 200, 'г'),  -- Овсянка
(13, 8, 1, 'шт'),   -- Лук
(13, 9, 1, 'шт'),   -- Морковь
(13, 19, 30, 'мл'), -- Масло растительное
(13, 17, 1, 'ч.л.'), -- Соль
(13, 18, 0.5, 'ч.л.'); -- Перец

-- Овсянка со свининой
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(14, 3, 500, 'г'),  -- Свинина
(14, 7, 200, 'г'),  -- Овсянка
(14, 8, 1, 'шт'),   -- Лук
(14, 19, 30, 'мл'), -- Масло растительное
(14, 17, 1, 'ч.л.'), -- Соль
(14, 18, 0.5, 'ч.л.'); -- Перец

-- Картофель с говядиной
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(15, 2, 500, 'г'),  -- Говядина
(15, 11, 800, 'г'), -- Картофель
(15, 8, 1, 'шт'),   -- Лук
(15, 13, 3, 'зуб'), -- Чеснок
(15, 19, 40, 'мл'), -- Масло растительное
(15, 17, 1, 'ч.л.'), -- Соль
(15, 18, 0.5, 'ч.л.'); -- Перец

-- Картофель со свининой
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(16, 3, 500, 'г'),  -- Свинина
(16, 11, 800, 'г'), -- Картофель
(16, 8, 1, 'шт'),   -- Лук
(16, 13, 3, 'зуб'), -- Чеснок
(16, 19, 40, 'мл'), -- Масло растительное
(16, 17, 1, 'ч.л.'), -- Соль
(16, 18, 0.5, 'ч.л.'); -- Перец

-- Макароны с яичницей
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(17, 21, 4, 'шт'),  -- Яйца
(17, 4, 300, 'г'),  -- Макароны
(17, 19, 30, 'мл'), -- Масло растительное
(17, 17, 1, 'ч.л.'), -- Соль
(17, 18, 0.5, 'ч.л.'); -- Перец

-- Гречка с яичницей
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(18, 21, 4, 'шт'),  -- Яйца
(18, 5, 200, 'г'),  -- Гречка
(18, 19, 30, 'мл'), -- Масло растительное
(18, 17, 1, 'ч.л.'), -- Соль
(18, 18, 0.5, 'ч.л.'); -- Перец

-- Рис с яичницей
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(19, 21, 4, 'шт'),  -- Яйца
(19, 6, 200, 'г'),  -- Рис
(19, 19, 30, 'мл'), -- Масло растительное
(19, 17, 1, 'ч.л.'), -- Соль
(19, 18, 0.5, 'ч.л.'); -- Перец

-- Картофель с яичницей
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(20, 21, 4, 'шт'),  -- Яйца
(20, 11, 600, 'г'), -- Картофель
(20, 8, 1, 'шт'),   -- Лук
(20, 19, 30, 'мл'), -- Масло растительное
(20, 17, 1, 'ч.л.'), -- Соль
(20, 18, 0.5, 'ч.л.'); -- Перец

-- Макароны с вареными яйцами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(21, 21, 4, 'шт'),  -- Яйца
(21, 4, 300, 'г'),  -- Макароны
(21, 17, 1, 'ч.л.'), -- Соль
(21, 20, 30, 'г'); -- Масло сливочное (опционально)

-- Гречка с вареными яйцами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(22, 21, 4, 'шт'),  -- Яйца
(22, 5, 200, 'г'),  -- Гречка
(22, 17, 1, 'ч.л.'), -- Соль
(22, 20, 30, 'г'); -- Масло сливочное (опционально)

-- Рис с вареными яйцами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(23, 21, 4, 'шт'),  -- Яйца
(23, 6, 200, 'г'),  -- Рис
(23, 17, 1, 'ч.л.'), -- Соль
(23, 20, 30, 'г'); -- Масло сливочное (опционально)

-- Картофель с вареными яйцами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(24, 21, 4, 'шт'),  -- Яйца
(24, 11, 600, 'г'), -- Картофель
(24, 17, 1, 'ч.л.'), -- Соль
(24, 20, 30, 'г'); -- Масло сливочное (опционально)

-- Макароны с овощами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(25, 4, 300, 'г'),  -- Макароны
(25, 10, 2, 'шт'),  -- Помидоры
(25, 8, 1, 'шт'),   -- Лук
(25, 9, 1, 'шт'),   -- Морковь
(25, 19, 30, 'мл'), -- Масло растительное
(25, 17, 1, 'ч.л.'), -- Соль
(25, 18, 0.5, 'ч.л.'); -- Перец

-- Гречка с овощами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(26, 5, 200, 'г'),  -- Гречка
(26, 9, 1, 'шт'),   -- Морковь
(26, 8, 1, 'шт'),   -- Лук
(26, 10, 2, 'шт'),  -- Помидоры
(26, 19, 30, 'мл'), -- Масло растительное
(26, 17, 1, 'ч.л.'), -- Соль
(26, 18, 0.5, 'ч.л.'); -- Перец

-- Рис с овощами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(27, 6, 200, 'г'),  -- Рис
(27, 9, 1, 'шт'),   -- Морковь
(27, 8, 1, 'шт'),   -- Лук
(27, 10, 2, 'шт'),  -- Помидоры
(27, 19, 30, 'мл'), -- Масло растительное
(27, 17, 1, 'ч.л.'), -- Соль
(27, 18, 0.5, 'ч.л.'); -- Перец

-- Картофель с овощами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(28, 11, 800, 'г'), -- Картофель
(28, 9, 1, 'шт'),   -- Морковь
(28, 8, 1, 'шт'),   -- Лук
(28, 10, 2, 'шт'),  -- Помидоры
(28, 19, 40, 'мл'), -- Масло растительное
(28, 17, 1, 'ч.л.'), -- Соль
(28, 18, 0.5, 'ч.л.'); -- Перец

-- Макароны с сыром
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(29, 4, 300, 'г'),  -- Макароны
(29, 15, 150, 'г'), -- Сыр
(29, 17, 1, 'ч.л.'); -- Соль

-- Гречка с грибами и луком
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(30, 5, 200, 'г'),  -- Гречка
(30, 8, 2, 'шт'),   -- Лук
(30, 19, 30, 'мл'), -- Масло растительное
(30, 17, 1, 'ч.л.'), -- Соль
(30, 18, 0.5, 'ч.л.'); -- Перец

-- Рис с курицей и овощами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(31, 6, 200, 'г'),  -- Рис
(31, 1, 500, 'г'),  -- Курица
(31, 9, 1, 'шт'),   -- Морковь
(31, 8, 1, 'шт'),   -- Лук
(31, 19, 30, 'мл'), -- Масло растительное
(31, 17, 1, 'ч.л.'), -- Соль
(31, 18, 0.5, 'ч.л.'); -- Перец

-- Картофель с курицей и овощами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(32, 11, 800, 'г'), -- Картофель
(32, 1, 500, 'г'),  -- Курица
(32, 9, 1, 'шт'),   -- Морковь
(32, 8, 1, 'шт'),   -- Лук
(32, 19, 40, 'мл'), -- Масло растительное
(32, 17, 1, 'ч.л.'), -- Соль
(32, 18, 0.5, 'ч.л.'); -- Перец

-- Овсяная каша с молоком
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(33, 7, 100, 'г'),  -- Овсянка
(33, 32, 400, 'мл'), -- Молоко
(33, 17, 0.5, 'ч.л.'); -- Соль

-- Котлеты из фарша
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(34, 40, 500, 'г'),  -- Фарш
(34, 8, 1, 'шт'),   -- Лук
(34, 21, 1, 'шт'),  -- Яйца
(34, 19, 40, 'мл'), -- Масло растительное
(34, 17, 1, 'ч.л.'), -- Соль
(34, 18, 0.5, 'ч.л.'); -- Перец

-- Макароны с сосисками
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(35, 4, 300, 'г'),  -- Макароны
(35, 41, 6, 'шт'),  -- Сосиски
(35, 8, 1, 'шт'),   -- Лук
(35, 19, 30, 'мл'), -- Масло растительное
(35, 17, 1, 'ч.л.'), -- Соль
(35, 18, 0.5, 'ч.л.'); -- Перец

-- Сосиски с картофелем
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(36, 41, 6, 'шт'),  -- Сосиски
(36, 11, 800, 'г'), -- Картофель
(36, 8, 1, 'шт'),   -- Лук
(36, 19, 40, 'мл'), -- Масло растительное
(36, 17, 1, 'ч.л.'), -- Соль
(36, 18, 0.5, 'ч.л.'); -- Перец

-- Сосиски с гречкой
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(37, 41, 6, 'шт'),  -- Сосиски
(37, 5, 200, 'г'),  -- Гречка
(37, 8, 1, 'шт'),   -- Лук
(37, 19, 30, 'мл'), -- Масло растительное
(37, 17, 1, 'ч.л.'), -- Соль
(37, 18, 0.5, 'ч.л.'); -- Перец

-- Сосиски с рисом
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(38, 41, 6, 'шт'),  -- Сосиски
(38, 6, 200, 'г'),  -- Рис
(38, 8, 1, 'шт'),   -- Лук
(38, 9, 1, 'шт'),   -- Морковь
(38, 19, 30, 'мл'), -- Масло растительное
(38, 17, 1, 'ч.л.'), -- Соль
(38, 18, 0.5, 'ч.л.'); -- Перец

-- Фарш с макаронами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(39, 40, 400, 'г'),  -- Фарш
(39, 4, 300, 'г'),  -- Макароны
(39, 8, 1, 'шт'),   -- Лук
(39, 19, 30, 'мл'), -- Масло растительное
(39, 17, 1, 'ч.л.'), -- Соль
(39, 18, 0.5, 'ч.л.'); -- Перец

-- Фарш с картофелем
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(40, 40, 400, 'г'),  -- Фарш
(40, 11, 800, 'г'), -- Картофель
(40, 8, 1, 'шт'),   -- Лук
(40, 9, 1, 'шт'),   -- Морковь
(40, 19, 40, 'мл'), -- Масло растительное
(40, 17, 1, 'ч.л.'), -- Соль
(40, 18, 0.5, 'ч.л.'); -- Перец

