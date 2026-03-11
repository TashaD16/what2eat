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
('Сосиски', 'meat', '/images/ingredients/sausages.jpg'),
('Грибы', 'vegetables', '/images/ingredients/mushrooms.jpg');

-- Блюда
INSERT OR IGNORE INTO dishes (name, description, image_url, cooking_time, difficulty, servings, estimated_cost, is_vegetarian, is_vegan, cuisine) VALUES
('Макароны с курицей', 'Сытное блюдо из пасты с обжаренной куриной грудкой, луком и специями. Готовится быстро и нравится всей семье.', 'https://source.unsplash.com/featured/600x400/?pasta,chicken&sig=101', 30, 'easy', 4, 8.00, 0, 0, 'russian'),
('Гречка с курицей', 'Гречневая каша с сочной курицей и морковью — сытный и полезный ужин в лучших традициях домашней кухни.', 'https://source.unsplash.com/featured/600x400/?buckwheat,chicken,bowl&sig=102', 40, 'easy', 4, 8.00, 0, 0, 'russian'),
('Рис с курицей', 'Нежный рис с кусочками курицы и луком — классическое сочетание, которое всегда получается вкусным.', 'https://source.unsplash.com/featured/600x400/?chicken,rice,bowl&sig=103', 35, 'easy', 4, 8.00, 0, 0, 'russian'),
('Макароны по-флотски', 'Советская классика: макароны с говяжьим фаршем и луком. Готовится за 25 минут и насыщает надолго.', 'https://source.unsplash.com/featured/600x400/?pasta,minced,meat&sig=104', 25, 'easy', 4, 9.00, 0, 0, 'russian'),
('Гречневая каша с мясом', 'Сытная гречка с тушёной говядиной, луком и морковью — идеальный обед для всей семьи.', 'https://source.unsplash.com/featured/600x400/?beef,buckwheat,stew&sig=105', 50, 'medium', 4, 10.00, 0, 0, 'russian'),
('Картофель с курицей', 'Запечённый картофель с курицей и чесноком — аппетитная хрустящая корочка и сочное мясо внутри.', 'https://source.unsplash.com/featured/600x400/?roasted,chicken,potato&sig=106', 45, 'easy', 4, 9.00, 0, 0, 'russian'),
('Макароны с говядиной', 'Паста с медленно тушёной говядиной, луком и морковью — насыщенное и согревающее блюдо.', 'https://source.unsplash.com/featured/600x400/?pasta,beef,stew&sig=107', 45, 'medium', 4, 11.00, 0, 0, 'russian'),
('Макароны со свининой', 'Макароны с обжаренной свининой — простой и сытный ужин, который понравится любителям мяса.', 'https://source.unsplash.com/featured/600x400/?pasta,pork,meat&sig=108', 35, 'easy', 4, 10.00, 0, 0, 'russian'),
('Рис с говядиной', 'Рассыпчатый рис с тушёной говядиной и овощами — полноценный обед с насыщенным вкусом.', 'https://source.unsplash.com/featured/600x400/?rice,beef,bowl&sig=109', 50, 'medium', 4, 11.00, 0, 0, 'russian'),
('Рис со свининой', 'Рис с обжаренными кусочками свинины и луком — быстрое и сытное блюдо на каждый день.', 'https://source.unsplash.com/featured/600x400/?rice,pork,asian&sig=110', 40, 'easy', 4, 10.00, 0, 0, 'russian'),
('Гречка со свининой', 'Гречневая каша с обжаренной свининой — традиционное домашнее блюдо с ароматом жареного мяса.', 'https://source.unsplash.com/featured/600x400/?buckwheat,pork,porridge&sig=111', 45, 'easy', 4, 10.00, 0, 0, 'russian'),
('Овсянка с курицей', 'Необычное сочетание: сытная овсяная каша с курицей и специями — питательный завтрак или обед.', 'https://source.unsplash.com/featured/600x400/?oatmeal,chicken,savory&sig=112', 30, 'easy', 4, 7.00, 0, 0, 'russian'),
('Овсянка с говядиной', 'Овсяная каша с кусочками говядины — оригинальное и питательное блюдо с высоким содержанием белка.', 'https://source.unsplash.com/featured/600x400/?oatmeal,beef,porridge&sig=113', 40, 'medium', 4, 9.00, 0, 0, 'russian'),
('Овсянка со свининой', 'Сытная овсяная каша со свининой — согревающее и питательное блюдо в холодный день.', 'https://source.unsplash.com/featured/600x400/?oatmeal,pork,bowl&sig=114', 35, 'easy', 4, 8.00, 0, 0, 'russian'),
('Картофель с говядиной', 'Запечённый картофель с тушёной говядиной и луком — классическое домашнее жаркое.', 'https://source.unsplash.com/featured/600x400/?roasted,beef,potato,oven&sig=115', 55, 'medium', 4, 12.00, 0, 0, 'russian'),
('Картофель со свининой', 'Румяный картофель с обжаренной свининой — простое, но очень вкусное блюдо с хрустящей корочкой.', 'https://source.unsplash.com/featured/600x400/?roasted,pork,potato&sig=116', 50, 'easy', 4, 10.00, 0, 0, 'russian'),
('Макароны с яичницей', 'Быстрый ужин: макароны с жареными яйцами и маслом — минимум усилий, максимум вкуса.', 'https://source.unsplash.com/featured/600x400/?pasta,fried,eggs,skillet&sig=117', 20, 'easy', 4, 4.00, 1, 0, 'russian'),
('Гречка с яичницей', 'Гречка с жареными яйцами — быстрый и сытный ужин, который всегда выручит когда нет времени.', 'https://source.unsplash.com/featured/600x400/?buckwheat,fried,eggs&sig=118', 25, 'easy', 4, 4.00, 1, 0, 'russian'),
('Рис с яичницей', 'Жареный рис с яйцом — азиатский стиль приготовления для быстрого и вкусного обеда.', 'https://source.unsplash.com/featured/600x400/?rice,egg,fried&sig=119', 25, 'easy', 4, 4.00, 1, 0, 'russian'),
('Картофель с яичницей', 'Картофель с жареными яйцами — народная классика, простое и очень сытное блюдо.', 'https://source.unsplash.com/featured/600x400/?potato,fried,eggs&sig=120', 30, 'easy', 4, 4.00, 1, 0, 'russian'),
('Макароны с вареными яйцами', 'Макароны с нарезанными варёными яйцами и маслом — лёгкий и быстрый вариант ужина.', 'https://source.unsplash.com/featured/600x400/?pasta,boiled,eggs,butter&sig=121', 20, 'easy', 4, 3.00, 1, 0, 'russian'),
('Гречка с вареными яйцами', 'Гречневая каша с варёными яйцами — простое, питательное и недорогое блюдо.', 'https://source.unsplash.com/featured/600x400/?buckwheat,boiled,eggs&sig=122', 30, 'easy', 4, 3.00, 1, 0, 'russian'),
('Рис с вареными яйцами', 'Рис с варёными яйцами — лёгкое блюдо с нежным вкусом, подходит для диеты.', 'https://source.unsplash.com/featured/600x400/?rice,boiled,eggs,healthy&sig=123', 30, 'easy', 4, 3.00, 1, 0, 'russian'),
('Картофель с вареными яйцами', 'Отварной картофель с варёными яйцами — лёгкий и быстрый вариант обеда или ужина.', 'https://source.unsplash.com/featured/600x400/?potato,boiled,eggs&sig=124', 35, 'easy', 4, 4.00, 1, 0, 'russian'),
('Макароны с овощами', 'Паста с помидорами, луком и морковью — яркое вегетарианское блюдо с насыщенным вкусом.', 'https://source.unsplash.com/featured/600x400/?pasta,vegetables,tomato&sig=125', 25, 'easy', 4, 5.00, 1, 1, 'russian'),
('Гречка с овощами', 'Гречка с морковью, луком и помидорами — полезное и вкусное вегетарианское блюдо.', 'https://source.unsplash.com/featured/600x400/?buckwheat,vegetables,healthy&sig=126', 30, 'easy', 4, 4.00, 1, 1, 'russian'),
('Рис с овощами', 'Рис с морковью, луком и помидорами — лёгкое и полезное блюдо для вегетарианцев и не только.', 'https://source.unsplash.com/featured/600x400/?rice,vegetables,colorful&sig=127', 30, 'easy', 4, 4.00, 1, 1, 'russian'),
('Картофель с овощами', 'Запечённый картофель с ассорти из овощей — красочное и ароматное вегетарианское блюдо.', 'https://source.unsplash.com/featured/600x400/?roasted,vegetables,potatoes,oven&sig=128', 40, 'easy', 4, 4.00, 1, 1, 'russian'),
('Макароны с сыром', 'Нежные макароны с расплавленным сыром — любимое блюдо детей и взрослых, готовится за 20 минут.', 'https://source.unsplash.com/featured/600x400/?mac,cheese,pasta,creamy&sig=129', 20, 'easy', 4, 5.00, 1, 0, 'russian'),
('Гречка с грибами и луком', 'Гречневая каша с обжаренными грибами и луком — ароматное вегетарианское блюдо с лесным вкусом.', 'https://source.unsplash.com/featured/600x400/?buckwheat,mushrooms,onion&sig=130', 35, 'easy', 4, 4.00, 1, 1, 'russian'),
('Рис с курицей и овощами', 'Рис с курицей, морковью и луком — сбалансированное и сытное блюдо для всей семьи.', 'https://source.unsplash.com/featured/600x400/?chicken,rice,vegetables,stir&sig=131', 40, 'easy', 4, 9.00, 0, 0, 'russian'),
('Картофель с курицей и овощами', 'Запечённый картофель с курицей и ассорти из овощей — яркое и ароматное блюдо из духовки.', 'https://source.unsplash.com/featured/600x400/?chicken,potato,roasted,vegetables,oven&sig=132', 50, 'medium', 4, 10.00, 0, 0, 'russian'),
('Овсяная каша с молоком', 'Классическая овсяная каша на молоке — идеальный завтрак для хорошего начала дня.', 'https://source.unsplash.com/featured/600x400/?oatmeal,porridge,milk,breakfast&sig=133', 15, 'easy', 2, 2.00, 1, 0, 'russian'),
('Котлеты из фарша', 'Классические домашние котлеты из мясного фарша — сочные, с румяной корочкой, тают во рту.', 'https://source.unsplash.com/featured/600x400/?meat,patties,cutlets,fried&sig=134', 30, 'easy', 4, 9.00, 0, 0, 'russian'),
('Макароны с сосисками', 'Простое и сытное блюдо из макарон с обжаренными сосисками — любимый ужин на скорую руку.', 'https://source.unsplash.com/featured/600x400/?pasta,sausage,quick&sig=135', 20, 'easy', 4, 6.00, 0, 0, 'russian'),
('Сосиски с картофелем', 'Жареные сосиски с картофелем — простое, сытное и очень популярное блюдо.', 'https://source.unsplash.com/featured/600x400/?sausage,potato,fried&sig=136', 30, 'easy', 4, 7.00, 0, 0, 'russian'),
('Сосиски с гречкой', 'Гречка с обжаренными сосисками — классическое простое блюдо, которое любят все.', 'https://source.unsplash.com/featured/600x400/?sausage,buckwheat,meal&sig=137', 30, 'easy', 4, 7.00, 0, 0, 'russian'),
('Сосиски с рисом', 'Рис с обжаренными сосисками — быстрый и сытный ужин, который понравится детям.', 'https://source.unsplash.com/featured/600x400/?sausage,rice,dinner&sig=138', 30, 'easy', 4, 7.00, 0, 0, 'russian'),
('Фарш с макаронами', 'Макароны с мясным фаршем и луком — сытное блюдо в одной сковороде за 25 минут.', 'https://source.unsplash.com/featured/600x400/?minced,meat,pasta,pan&sig=139', 25, 'easy', 4, 8.00, 0, 0, 'russian'),
('Фарш с картофелем', 'Жареный фарш с кусочками картофеля и луком — быстрый и очень сытный ужин.', 'https://source.unsplash.com/featured/600x400/?minced,meat,potato,skillet&sig=140', 35, 'easy', 4, 8.00, 0, 0, 'russian');

-- Связи блюд и ингредиентов
-- Макароны с курицей (id=1)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(1, 1), -- Курица
(1, 4), -- Макароны
(1, 8), -- Лук
(1, 34); -- Масло растительное

-- Гречка с курицей (id=2)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(2, 1), -- Курица
(2, 5), -- Гречка
(2, 8), -- Лук
(2, 9), -- Морковь
(2, 34); -- Масло растительное

-- Рис с курицей (id=3)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(3, 1), -- Курица
(3, 6), -- Рис
(3, 8), -- Лук
(3, 9), -- Морковь
(3, 34); -- Масло растительное

-- Макароны по-флотски (id=4)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(4, 2), -- Говядина
(4, 4), -- Макароны
(4, 8), -- Лук
(4, 34); -- Масло растительное

-- Гречневая каша с мясом (id=5)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(5, 2), -- Говядина
(5, 5), -- Гречка
(5, 8), -- Лук
(5, 9), -- Морковь
(5, 34); -- Масло растительное

-- Картофель с курицей (id=6)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(6, 1), -- Курица
(6, 11), -- Картофель
(6, 8), -- Лук
(6, 13), -- Чеснок
(6, 34); -- Масло растительное

-- Макароны с говядиной (id=7)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(7, 2), -- Говядина
(7, 4), -- Макароны
(7, 8), -- Лук
(7, 9), -- Морковь
(7, 34); -- Масло растительное

-- Макароны со свининой (id=8)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(8, 3), -- Свинина
(8, 4), -- Макароны
(8, 8), -- Лук
(8, 34); -- Масло растительное

-- Рис с говядиной (id=9)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(9, 2), -- Говядина
(9, 6), -- Рис
(9, 8), -- Лук
(9, 9), -- Морковь
(9, 34); -- Масло растительное

-- Рис со свининой (id=10)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(10, 3), -- Свинина
(10, 6), -- Рис
(10, 8), -- Лук
(10, 9), -- Морковь
(10, 34); -- Масло растительное

-- Гречка со свининой (id=11)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(11, 3), -- Свинина
(11, 5), -- Гречка
(11, 8), -- Лук
(11, 9), -- Морковь
(11, 34); -- Масло растительное

-- Овсянка с курицей (id=12)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(12, 1), -- Курица
(12, 7), -- Овсянка
(12, 8), -- Лук
(12, 34); -- Масло растительное

-- Овсянка с говядиной (id=13)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(13, 2), -- Говядина
(13, 7), -- Овсянка
(13, 8), -- Лук
(13, 9), -- Морковь
(13, 34); -- Масло растительное

-- Овсянка со свининой (id=14)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(14, 3), -- Свинина
(14, 7), -- Овсянка
(14, 8), -- Лук
(14, 34); -- Масло растительное

-- Картофель с говядиной (id=15)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(15, 2), -- Говядина
(15, 11), -- Картофель
(15, 8), -- Лук
(15, 13), -- Чеснок
(15, 34); -- Масло растительное

-- Картофель со свининой (id=16)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(16, 3), -- Свинина
(16, 11), -- Картофель
(16, 8), -- Лук
(16, 13), -- Чеснок
(16, 34); -- Масло растительное

-- Макароны с яичницей (id=17)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(17, 31), -- Яйца
(17, 4), -- Макароны
(17, 34); -- Масло растительное

-- Гречка с яичницей (id=18)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(18, 31), -- Яйца
(18, 5), -- Гречка
(18, 34); -- Масло растительное

-- Рис с яичницей (id=19)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(19, 31), -- Яйца
(19, 6), -- Рис
(19, 34); -- Масло растительное

-- Картофель с яичницей (id=20)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(20, 31), -- Яйца
(20, 11), -- Картофель
(20, 8), -- Лук
(20, 34); -- Масло растительное

-- Макароны с вареными яйцами (id=21)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(21, 31), -- Яйца
(21, 4); -- Макароны

-- Гречка с вареными яйцами (id=22)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(22, 31), -- Яйца
(22, 5); -- Гречка

-- Рис с вареными яйцами (id=23)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(23, 31), -- Яйца
(23, 6); -- Рис

-- Картофель с вареными яйцами (id=24)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(24, 31), -- Яйца
(24, 11); -- Картофель

-- Макароны с овощами (id=25)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(25, 4), -- Макароны
(25, 10), -- Помидоры
(25, 8), -- Лук
(25, 9), -- Морковь
(25, 34); -- Масло растительное

-- Гречка с овощами (id=26)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(26, 5), -- Гречка
(26, 9), -- Морковь
(26, 8), -- Лук
(26, 10), -- Помидоры
(26, 34); -- Масло растительное

-- Рис с овощами (id=27)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(27, 6), -- Рис
(27, 9), -- Морковь
(27, 8), -- Лук
(27, 10), -- Помидоры
(27, 34); -- Масло растительное

-- Картофель с овощами (id=28)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(28, 11), -- Картофель
(28, 9), -- Морковь
(28, 8), -- Лук
(28, 10), -- Помидоры
(28, 34); -- Масло растительное

-- Макароны с сыром (id=29)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(29, 4), -- Макароны
(29, 29); -- Сыр

-- Гречка с грибами и луком (id=30)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(30, 5),  -- Гречка
(30, 8),  -- Лук
(30, 38), -- Грибы
(30, 34); -- Масло растительное

-- Рис с курицей и овощами (id=31)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(31, 6), -- Рис
(31, 1), -- Курица
(31, 9), -- Морковь
(31, 8), -- Лук
(31, 34); -- Масло растительное

-- Картофель с курицей и овощами (id=32)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(32, 11), -- Картофель
(32, 1), -- Курица
(32, 9), -- Морковь
(32, 8), -- Лук
(32, 34); -- Масло растительное

-- Овсяная каша с молоком (id=33)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(33, 7), -- Овсянка
(33, 28); -- Молоко

-- Котлеты из фарша (id=34)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(34, 36), -- Фарш
(34, 8), -- Лук
(34, 31), -- Яйца
(34, 34); -- Масло растительное

-- Макароны с сосисками (id=35)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(35, 4), -- Макароны
(35, 37), -- Сосиски
(35, 8), -- Лук
(35, 34); -- Масло растительное

-- Сосиски с картофелем (id=36)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(36, 37), -- Сосиски
(36, 11), -- Картофель
(36, 8), -- Лук
(36, 34); -- Масло растительное

-- Сосиски с гречкой (id=37)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(37, 37), -- Сосиски
(37, 5), -- Гречка
(37, 8), -- Лук
(37, 34); -- Масло растительное

-- Сосиски с рисом (id=38)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(38, 37), -- Сосиски
(38, 6), -- Рис
(38, 8), -- Лук
(38, 9), -- Морковь
(38, 34); -- Масло растительное

-- Фарш с макаронами (id=39)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(39, 36), -- Фарш
(39, 4), -- Макароны
(39, 8), -- Лук
(39, 34); -- Масло растительное

-- Фарш с картофелем (id=40)
INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES
(40, 36), -- Фарш
(40, 11), -- Картофель
(40, 8), -- Лук
(40, 9), -- Морковь
(40, 34); -- Масло растительное

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

(25, '[
  {"step": 1, "description": "Отварить макароны согласно инструкции на упаковке"},
  {"step": 2, "description": "Нарезать лук полукольцами, морковь натереть на тёрке"},
  {"step": 3, "description": "Нарезать помидоры кубиками"},
  {"step": 4, "description": "Разогреть сковороду с растительным маслом"},
  {"step": 5, "description": "Обжарить лук и морковь до мягкости"},
  {"step": 6, "description": "Добавить помидоры и тушить ещё 5 минут"},
  {"step": 7, "description": "Посолить и поперчить по вкусу"},
  {"step": 8, "description": "Смешать с горячими макаронами и подавать"}
]'),

(26, '[
  {"step": 1, "description": "Промыть гречку и залить водой в соотношении 1:2"},
  {"step": 2, "description": "Нарезать лук, морковь натереть на тёрке, помидоры нарезать кубиками"},
  {"step": 3, "description": "Разогреть сковороду с растительным маслом"},
  {"step": 4, "description": "Обжарить лук и морковь до мягкости"},
  {"step": 5, "description": "Добавить помидоры и тушить 5 минут"},
  {"step": 6, "description": "Варить гречку на медленном огне 20 минут"},
  {"step": 7, "description": "Смешать гречку с овощами, посолить и поперчить"},
  {"step": 8, "description": "Подавать горячим"}
]'),

(27, '[
  {"step": 1, "description": "Промыть рис и залить водой в соотношении 1:2"},
  {"step": 2, "description": "Нарезать лук, морковь натереть, помидоры нарезать кубиками"},
  {"step": 3, "description": "Разогреть сковороду с растительным маслом"},
  {"step": 4, "description": "Обжарить лук и морковь до мягкости"},
  {"step": 5, "description": "Добавить помидоры и тушить 5 минут"},
  {"step": 6, "description": "Варить рис на медленном огне 20 минут"},
  {"step": 7, "description": "Смешать рис с овощами, посолить и поперчить"},
  {"step": 8, "description": "Подавать горячим"}
]'),

(28, '[
  {"step": 1, "description": "Нарезать картофель крупными дольками"},
  {"step": 2, "description": "Нарезать лук, морковь и помидоры"},
  {"step": 3, "description": "Смешать все овощи с растительным маслом, посолить и поперчить"},
  {"step": 4, "description": "Выложить на противень в один слой"},
  {"step": 5, "description": "Запекать при 200°C 35-40 минут до золотистой корочки"},
  {"step": 6, "description": "Перемешать в середине запекания"},
  {"step": 7, "description": "Подавать горячим"}
]'),

(29, '[
  {"step": 1, "description": "Отварить макароны согласно инструкции на упаковке"},
  {"step": 2, "description": "Натереть сыр на мелкой тёрке"},
  {"step": 3, "description": "Слить воду с макарон, оставив 2-3 ст.л. отвара"},
  {"step": 4, "description": "Добавить к горячим макаронам сыр и перемешать"},
  {"step": 5, "description": "Влить немного отвара, чтобы получился кремовый соус"},
  {"step": 6, "description": "Посолить по вкусу и подавать немедленно"}
]'),

(30, '[
  {"step": 1, "description": "Промыть гречку и залить водой в соотношении 1:2"},
  {"step": 2, "description": "Нарезать грибы пластинками, лук полукольцами"},
  {"step": 3, "description": "Разогреть сковороду с растительным маслом"},
  {"step": 4, "description": "Обжарить лук до прозрачности"},
  {"step": 5, "description": "Добавить грибы и жарить до испарения жидкости, 10-12 минут"},
  {"step": 6, "description": "Посолить и поперчить по вкусу"},
  {"step": 7, "description": "Варить гречку на медленном огне 20 минут"},
  {"step": 8, "description": "Смешать готовую гречку с грибами и луком, подавать горячим"}
]'),

(31, '[
  {"step": 1, "description": "Промыть рис и залить водой в соотношении 1:2"},
  {"step": 2, "description": "Нарезать курицу кубиками, лук и морковь"},
  {"step": 3, "description": "Разогреть сковороду с растительным маслом"},
  {"step": 4, "description": "Обжарить лук и морковь до мягкости"},
  {"step": 5, "description": "Добавить курицу и обжарить до готовности"},
  {"step": 6, "description": "Посолить и поперчить по вкусу"},
  {"step": 7, "description": "Варить рис на медленном огне 20 минут"},
  {"step": 8, "description": "Смешать рис с курицей и овощами, подавать горячим"}
]'),

(32, '[
  {"step": 1, "description": "Нарезать картофель крупными дольками"},
  {"step": 2, "description": "Нарезать курицу кусками, лук и морковь"},
  {"step": 3, "description": "Смешать курицу и овощи с растительным маслом"},
  {"step": 4, "description": "Посолить, поперчить, добавить специи по вкусу"},
  {"step": 5, "description": "Выложить на противень и запекать при 200°C 45-50 минут"},
  {"step": 6, "description": "Перевернуть курицу в середине запекания"},
  {"step": 7, "description": "Подавать горячим"}
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
(1, 1, 500, 'г'),   -- Курица
(1, 4, 300, 'г'),   -- Макароны
(1, 8, 1, 'шт'),    -- Лук
(1, 34, 30, 'мл'),  -- Масло растительное
(1, 32, 1, 'ч.л.'), -- Соль
(1, 33, 0.5, 'ч.л.'); -- Перец черный

-- Гречка с курицей
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(2, 1, 500, 'г'),   -- Курица
(2, 5, 200, 'г'),   -- Гречка
(2, 8, 1, 'шт'),    -- Лук
(2, 9, 1, 'шт'),    -- Морковь
(2, 34, 30, 'мл'),  -- Масло растительное
(2, 32, 1, 'ч.л.'), -- Соль
(2, 33, 0.5, 'ч.л.'); -- Перец черный

-- Рис с курицей
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(3, 1, 500, 'г'),   -- Курица
(3, 6, 200, 'г'),   -- Рис
(3, 8, 1, 'шт'),    -- Лук
(3, 9, 1, 'шт'),    -- Морковь
(3, 34, 30, 'мл'),  -- Масло растительное
(3, 32, 1, 'ч.л.'), -- Соль
(3, 33, 0.5, 'ч.л.'); -- Перец черный

-- Макароны по-флотски
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(4, 2, 400, 'г'),   -- Говядина (фарш)
(4, 4, 300, 'г'),   -- Макароны
(4, 8, 1, 'шт'),    -- Лук
(4, 34, 30, 'мл'),  -- Масло растительное
(4, 32, 1, 'ч.л.'), -- Соль
(4, 33, 0.5, 'ч.л.'); -- Перец черный

-- Гречневая каша с мясом
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(5, 2, 500, 'г'),   -- Говядина
(5, 5, 200, 'г'),   -- Гречка
(5, 8, 1, 'шт'),    -- Лук
(5, 9, 1, 'шт'),    -- Морковь
(5, 34, 30, 'мл'),  -- Масло растительное
(5, 32, 1, 'ч.л.'), -- Соль
(5, 33, 0.5, 'ч.л.'); -- Перец черный

-- Картофель с курицей
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(6, 1, 500, 'г'),   -- Курица
(6, 11, 800, 'г'),  -- Картофель
(6, 8, 1, 'шт'),    -- Лук
(6, 13, 3, 'зуб'),  -- Чеснок
(6, 34, 40, 'мл'),  -- Масло растительное
(6, 32, 1, 'ч.л.'), -- Соль
(6, 33, 0.5, 'ч.л.'); -- Перец черный

-- Макароны с говядиной
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(7, 2, 500, 'г'),   -- Говядина
(7, 4, 300, 'г'),   -- Макароны
(7, 8, 1, 'шт'),    -- Лук
(7, 9, 1, 'шт'),    -- Морковь
(7, 34, 30, 'мл'),  -- Масло растительное
(7, 32, 1, 'ч.л.'), -- Соль
(7, 33, 0.5, 'ч.л.'); -- Перец черный

-- Макароны со свининой
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(8, 3, 500, 'г'),   -- Свинина
(8, 4, 300, 'г'),   -- Макароны
(8, 8, 1, 'шт'),    -- Лук
(8, 34, 30, 'мл'),  -- Масло растительное
(8, 32, 1, 'ч.л.'), -- Соль
(8, 33, 0.5, 'ч.л.'); -- Перец черный

-- Рис с говядиной
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(9, 2, 500, 'г'),   -- Говядина
(9, 6, 200, 'г'),   -- Рис
(9, 8, 1, 'шт'),    -- Лук
(9, 9, 1, 'шт'),    -- Морковь
(9, 34, 30, 'мл'),  -- Масло растительное
(9, 32, 1, 'ч.л.'), -- Соль
(9, 33, 0.5, 'ч.л.'); -- Перец черный

-- Рис со свининой
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(10, 3, 500, 'г'),   -- Свинина
(10, 6, 200, 'г'),   -- Рис
(10, 8, 1, 'шт'),    -- Лук
(10, 9, 1, 'шт'),    -- Морковь
(10, 34, 30, 'мл'),  -- Масло растительное
(10, 32, 1, 'ч.л.'), -- Соль
(10, 33, 0.5, 'ч.л.'); -- Перец черный

-- Гречка со свининой
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(11, 3, 500, 'г'),   -- Свинина
(11, 5, 200, 'г'),   -- Гречка
(11, 8, 1, 'шт'),    -- Лук
(11, 9, 1, 'шт'),    -- Морковь
(11, 34, 30, 'мл'),  -- Масло растительное
(11, 32, 1, 'ч.л.'), -- Соль
(11, 33, 0.5, 'ч.л.'); -- Перец черный

-- Овсянка с курицей
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(12, 1, 500, 'г'),   -- Курица
(12, 7, 200, 'г'),   -- Овсянка
(12, 8, 1, 'шт'),    -- Лук
(12, 34, 30, 'мл'),  -- Масло растительное
(12, 32, 1, 'ч.л.'), -- Соль
(12, 33, 0.5, 'ч.л.'); -- Перец черный

-- Овсянка с говядиной
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(13, 2, 500, 'г'),   -- Говядина
(13, 7, 200, 'г'),   -- Овсянка
(13, 8, 1, 'шт'),    -- Лук
(13, 9, 1, 'шт'),    -- Морковь
(13, 34, 30, 'мл'),  -- Масло растительное
(13, 32, 1, 'ч.л.'), -- Соль
(13, 33, 0.5, 'ч.л.'); -- Перец черный

-- Овсянка со свининой
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(14, 3, 500, 'г'),   -- Свинина
(14, 7, 200, 'г'),   -- Овсянка
(14, 8, 1, 'шт'),    -- Лук
(14, 34, 30, 'мл'),  -- Масло растительное
(14, 32, 1, 'ч.л.'), -- Соль
(14, 33, 0.5, 'ч.л.'); -- Перец черный

-- Картофель с говядиной
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(15, 2, 500, 'г'),   -- Говядина
(15, 11, 800, 'г'),  -- Картофель
(15, 8, 1, 'шт'),    -- Лук
(15, 13, 3, 'зуб'),  -- Чеснок
(15, 34, 40, 'мл'),  -- Масло растительное
(15, 32, 1, 'ч.л.'), -- Соль
(15, 33, 0.5, 'ч.л.'); -- Перец черный

-- Картофель со свининой
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(16, 3, 500, 'г'),   -- Свинина
(16, 11, 800, 'г'),  -- Картофель
(16, 8, 1, 'шт'),    -- Лук
(16, 13, 3, 'зуб'),  -- Чеснок
(16, 34, 40, 'мл'),  -- Масло растительное
(16, 32, 1, 'ч.л.'), -- Соль
(16, 33, 0.5, 'ч.л.'); -- Перец черный

-- Макароны с яичницей
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(17, 31, 4, 'шт'),   -- Яйца
(17, 4, 300, 'г'),   -- Макароны
(17, 34, 30, 'мл'),  -- Масло растительное
(17, 32, 1, 'ч.л.'), -- Соль
(17, 33, 0.5, 'ч.л.'); -- Перец черный

-- Гречка с яичницей
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(18, 31, 4, 'шт'),   -- Яйца
(18, 5, 200, 'г'),   -- Гречка
(18, 34, 30, 'мл'),  -- Масло растительное
(18, 32, 1, 'ч.л.'), -- Соль
(18, 33, 0.5, 'ч.л.'); -- Перец черный

-- Рис с яичницей
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(19, 31, 4, 'шт'),   -- Яйца
(19, 6, 200, 'г'),   -- Рис
(19, 34, 30, 'мл'),  -- Масло растительное
(19, 32, 1, 'ч.л.'), -- Соль
(19, 33, 0.5, 'ч.л.'); -- Перец черный

-- Картофель с яичницей
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(20, 31, 4, 'шт'),   -- Яйца
(20, 11, 600, 'г'),  -- Картофель
(20, 8, 1, 'шт'),    -- Лук
(20, 34, 30, 'мл'),  -- Масло растительное
(20, 32, 1, 'ч.л.'), -- Соль
(20, 33, 0.5, 'ч.л.'); -- Перец черный

-- Макароны с вареными яйцами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(21, 31, 4, 'шт'),   -- Яйца
(21, 4, 300, 'г'),   -- Макароны
(21, 32, 1, 'ч.л.'), -- Соль
(21, 35, 30, 'г');   -- Масло сливочное

-- Гречка с вареными яйцами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(22, 31, 4, 'шт'),   -- Яйца
(22, 5, 200, 'г'),   -- Гречка
(22, 32, 1, 'ч.л.'), -- Соль
(22, 35, 30, 'г');   -- Масло сливочное

-- Рис с вареными яйцами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(23, 31, 4, 'шт'),   -- Яйца
(23, 6, 200, 'г'),   -- Рис
(23, 32, 1, 'ч.л.'), -- Соль
(23, 35, 30, 'г');   -- Масло сливочное

-- Картофель с вареными яйцами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(24, 31, 4, 'шт'),   -- Яйца
(24, 11, 600, 'г'),  -- Картофель
(24, 32, 1, 'ч.л.'), -- Соль
(24, 35, 30, 'г');   -- Масло сливочное

-- Макароны с овощами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(25, 4, 300, 'г'),   -- Макароны
(25, 10, 2, 'шт'),   -- Помидоры
(25, 8, 1, 'шт'),    -- Лук
(25, 9, 1, 'шт'),    -- Морковь
(25, 34, 30, 'мл'),  -- Масло растительное
(25, 32, 1, 'ч.л.'), -- Соль
(25, 33, 0.5, 'ч.л.'); -- Перец черный

-- Гречка с овощами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(26, 5, 200, 'г'),   -- Гречка
(26, 9, 1, 'шт'),    -- Морковь
(26, 8, 1, 'шт'),    -- Лук
(26, 10, 2, 'шт'),   -- Помидоры
(26, 34, 30, 'мл'),  -- Масло растительное
(26, 32, 1, 'ч.л.'), -- Соль
(26, 33, 0.5, 'ч.л.'); -- Перец черный

-- Рис с овощами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(27, 6, 200, 'г'),   -- Рис
(27, 9, 1, 'шт'),    -- Морковь
(27, 8, 1, 'шт'),    -- Лук
(27, 10, 2, 'шт'),   -- Помидоры
(27, 34, 30, 'мл'),  -- Масло растительное
(27, 32, 1, 'ч.л.'), -- Соль
(27, 33, 0.5, 'ч.л.'); -- Перец черный

-- Картофель с овощами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(28, 11, 800, 'г'),  -- Картофель
(28, 9, 1, 'шт'),    -- Морковь
(28, 8, 1, 'шт'),    -- Лук
(28, 10, 2, 'шт'),   -- Помидоры
(28, 34, 40, 'мл'),  -- Масло растительное
(28, 32, 1, 'ч.л.'), -- Соль
(28, 33, 0.5, 'ч.л.'); -- Перец черный

-- Макароны с сыром
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(29, 4, 300, 'г'),   -- Макароны
(29, 29, 150, 'г'),  -- Сыр
(29, 32, 1, 'ч.л.'); -- Соль

-- Гречка с грибами и луком
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(30, 5, 200, 'г'),   -- Гречка
(30, 38, 300, 'г'),  -- Грибы
(30, 8, 2, 'шт'),    -- Лук
(30, 34, 30, 'мл'),  -- Масло растительное
(30, 32, 1, 'ч.л.'), -- Соль
(30, 33, 0.5, 'ч.л.'); -- Перец черный

-- Рис с курицей и овощами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(31, 6, 200, 'г'),   -- Рис
(31, 1, 500, 'г'),   -- Курица
(31, 9, 1, 'шт'),    -- Морковь
(31, 8, 1, 'шт'),    -- Лук
(31, 34, 30, 'мл'),  -- Масло растительное
(31, 32, 1, 'ч.л.'), -- Соль
(31, 33, 0.5, 'ч.л.'); -- Перец черный

-- Картофель с курицей и овощами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(32, 11, 800, 'г'),  -- Картофель
(32, 1, 500, 'г'),   -- Курица
(32, 9, 1, 'шт'),    -- Морковь
(32, 8, 1, 'шт'),    -- Лук
(32, 34, 40, 'мл'),  -- Масло растительное
(32, 32, 1, 'ч.л.'), -- Соль
(32, 33, 0.5, 'ч.л.'); -- Перец черный

-- Овсяная каша с молоком
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(33, 7, 100, 'г'),    -- Овсянка
(33, 28, 400, 'мл'),  -- Молоко
(33, 32, 0.5, 'ч.л.'); -- Соль

-- Котлеты из фарша
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(34, 36, 500, 'г'),  -- Фарш
(34, 8, 1, 'шт'),    -- Лук
(34, 31, 1, 'шт'),   -- Яйца
(34, 34, 40, 'мл'),  -- Масло растительное
(34, 32, 1, 'ч.л.'), -- Соль
(34, 33, 0.5, 'ч.л.'); -- Перец черный

-- Макароны с сосисками
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(35, 4, 300, 'г'),   -- Макароны
(35, 37, 6, 'шт'),   -- Сосиски
(35, 8, 1, 'шт'),    -- Лук
(35, 34, 30, 'мл'),  -- Масло растительное
(35, 32, 1, 'ч.л.'), -- Соль
(35, 33, 0.5, 'ч.л.'); -- Перец черный

-- Сосиски с картофелем
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(36, 37, 6, 'шт'),   -- Сосиски
(36, 11, 800, 'г'),  -- Картофель
(36, 8, 1, 'шт'),    -- Лук
(36, 34, 40, 'мл'),  -- Масло растительное
(36, 32, 1, 'ч.л.'), -- Соль
(36, 33, 0.5, 'ч.л.'); -- Перец черный

-- Сосиски с гречкой
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(37, 37, 6, 'шт'),   -- Сосиски
(37, 5, 200, 'г'),   -- Гречка
(37, 8, 1, 'шт'),    -- Лук
(37, 34, 30, 'мл'),  -- Масло растительное
(37, 32, 1, 'ч.л.'), -- Соль
(37, 33, 0.5, 'ч.л.'); -- Перец черный

-- Сосиски с рисом
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(38, 37, 6, 'шт'),   -- Сосиски
(38, 6, 200, 'г'),   -- Рис
(38, 8, 1, 'шт'),    -- Лук
(38, 9, 1, 'шт'),    -- Морковь
(38, 34, 30, 'мл'),  -- Масло растительное
(38, 32, 1, 'ч.л.'), -- Соль
(38, 33, 0.5, 'ч.л.'); -- Перец черный

-- Фарш с макаронами
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(39, 36, 400, 'г'),  -- Фарш
(39, 4, 300, 'г'),   -- Макароны
(39, 8, 1, 'шт'),    -- Лук
(39, 34, 30, 'мл'),  -- Масло растительное
(39, 32, 1, 'ч.л.'), -- Соль
(39, 33, 0.5, 'ч.л.'); -- Перец черный

-- Фарш с картофелем
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
(40, 36, 400, 'г'),  -- Фарш
(40, 11, 800, 'г'),  -- Картофель
(40, 8, 1, 'шт'),    -- Лук
(40, 9, 1, 'шт'),    -- Морковь
(40, 34, 40, 'мл'),  -- Масло растительное
(40, 32, 1, 'ч.л.'), -- Соль
(40, 33, 0.5, 'ч.л.'); -- Перец черный

