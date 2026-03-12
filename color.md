**Главная цель:** интерфейс должен быть невероятно аппетитным, тёплым, уютным и приятным для долгого использования — как будто пользователь стоит на светлой кухне с свежими продуктами. Пользователь должен чувствовать голод и радость одновременно.

---

# Color System — Вариант B «Тёплый / Food» ✅ (выбран)

## Palette

| Роль | CSS var | HEX |
|------|---------|-----|
| Primary (CTA, selected ingredient) | `--color-primary` | `#F97316` |
| Primary dark | `--color-primary-dk` | `#EA6C0A` |
| Primary light | `--color-primary-lt` | `#FB923C` |
| Secondary / AI badge | `--color-secondary` | `#FCBB00` |
| Like / Success | `--color-like` | `#22C55E` |
| Dislike | `--color-dislike` | `#FF4D4D` |
| Info button | `--color-info` | `#A855F7` |
| Warning / Loading spinner | `--color-warning` | `#FF9500` |
| Vegan tag | `--tag-vegan` | `#4ADE80` |
| Vegetarian tag | `--tag-vegetarian` | `#FBBF24` |
| Ingredient tag bullet | `--tag-ingredient` | `#FF9500` |
| Cuisine filter chip | `--tag-filter` | `#90CAF9` |
| Missing ingredient | `--tag-missing` | `#FBBF24` |
| Budget tag | `--tag-budget` | `#CE93D8` |

## Rules

- **Like `#22C55E` / Dislike `#FF4D4D`** — семантические цвета, никогда не менять
- **Выбранный ингредиент** = primary (`#F97316`), НЕ красный
- **Logo gradient** = `#F97316 → #FCBB00` (оранж → жёлтый)
- **CTA button gradient** = `#EA6C0A → #F97316`
- **Step number circles** = primary gradient `#EA6C0A → #F97316`
- Vegan / Vegetarian chips не трогать
- Cuisine filter `#90CAF9` уникален, не конфликтует

## Что НЕ является primary

`#FF9500` (warning/spinner/bullet) остаётся как отдельный акцент «тепло-оранжевый» для второстепенных деталей.
