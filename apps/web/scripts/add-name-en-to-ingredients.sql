-- Migration: add name_en column to ingredients table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS name_en TEXT;

UPDATE ingredients SET name_en = CASE name
  -- Meat
  WHEN 'Курица'            THEN 'Chicken'
  WHEN 'Говядина'          THEN 'Beef'
  WHEN 'Свинина'           THEN 'Pork'
  WHEN 'Фарш'              THEN 'Minced meat'
  WHEN 'Сосиски'           THEN 'Sausages'
  -- Cereals
  WHEN 'Макароны'          THEN 'Pasta'
  WHEN 'Гречка'            THEN 'Buckwheat'
  WHEN 'Рис'               THEN 'Rice'
  WHEN 'Овсянка'           THEN 'Oatmeal'
  -- Vegetables
  WHEN 'Лук'               THEN 'Onion'
  WHEN 'Морковь'           THEN 'Carrot'
  WHEN 'Помидоры'          THEN 'Tomatoes'
  WHEN 'Картофель'         THEN 'Potato'
  WHEN 'Перец болгарский'  THEN 'Bell pepper'
  WHEN 'Чеснок'            THEN 'Garlic'
  WHEN 'Огурцы'            THEN 'Cucumber'
  WHEN 'Капуста'           THEN 'Cabbage'
  WHEN 'Кабачки'           THEN 'Zucchini'
  WHEN 'Баклажаны'         THEN 'Eggplant'
  WHEN 'Свекла'            THEN 'Beetroot'
  WHEN 'Редис'             THEN 'Radish'
  WHEN 'Укроп'             THEN 'Dill'
  WHEN 'Петрушка'          THEN 'Parsley'
  WHEN 'Шпинат'            THEN 'Spinach'
  WHEN 'Брокколи'          THEN 'Broccoli'
  WHEN 'Цветная капуста'   THEN 'Cauliflower'
  WHEN 'Лук зеленый'       THEN 'Spring onion'
  WHEN 'Сельдерей'         THEN 'Celery'
  WHEN 'Тыква'             THEN 'Pumpkin'
  -- Dairy
  WHEN 'Молоко'            THEN 'Milk'
  WHEN 'Сыр'               THEN 'Cheese'
  WHEN 'Сметана'           THEN 'Sour cream'
  WHEN 'Яйца'              THEN 'Eggs'
  WHEN 'Масло сливочное'   THEN 'Butter'
  -- Spices / Other
  WHEN 'Соль'              THEN 'Salt'
  WHEN 'Перец черный'      THEN 'Black pepper'
  WHEN 'Масло растительное' THEN 'Vegetable oil'
  ELSE NULL
END;
