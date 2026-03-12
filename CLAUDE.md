# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Type-check + build for production (tsc && vite build)
npm run preview   # Preview production build
npm run lint      # ESLint with zero warnings allowed
npm run format    # Prettier format src/**/*.{ts,tsx,json,css}
```

No test runner is configured yet.

## Architecture

**What2Eat** ("ЧтоЕсть") is a meal planning React SPA for a couple. The UI is in Russian. Данные хранятся в **Supabase**; локальная SQLite БД не используется.

### Data layer: Supabase

- `src/services/supabase.ts` — клиент Supabase; `isSupabaseConfigured()` проверяет наличие `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`
- **Таблицы в Supabase:**
  - `ingredients` — id (serial), name, category (`meat|cereals|vegetables|dairy|spices|other`), image_url. Создание и сид: `apps/web/scripts/supabase-ingredients.sql`
  - `global_recipes` — рецепты (id UUID, name, description, instructions JSONB, ingredients JSONB, cooking_time, difficulty, image_url и т.д.)
- Рецепты и поиск блюд идут только через `global_recipes`; ингредиенты — через таблицу `ingredients`

### Service layer (`src/services/`)

- `ingredients.ts` — `getAllIngredients`, `getIngredientsByCategory`, `searchIngredients` (Supabase)
- `globalRecipes.ts` — `searchGlobalRecipesByIngredients`, `searchGlobalRecipesByName`, `getGlobalRecipeById`, `getGlobalRecipesByIds`, `saveGlobalRecipe`
- `dishes.ts` — только тип `FindDishesOptions` и заглушка `findDishesByIngredients` (возвращает `[]`); блюда подгружаются из global_recipes в App
- `recipes.ts` — заглушка `getRecipeByDishId` (возвращает `null`); полные рецепты показываются через AIRecipeView и `getGlobalRecipeById`

### State management: Redux Toolkit (`src/store/`)

Three slices — all follow the same `{ data, loading, error }` pattern with `createAsyncThunk`:

| Slice | State |
|-------|-------|
| `ingredients` | `ingredients[]`, `selectedIngredients: number[]`, loading, error |
| `dishes` | `dishes[]`, loading, error |
| `recipe` | `currentRecipe: Recipe \| null`, loading, error |

Use typed hooks from `src/hooks/redux.ts` (`useAppSelector`, `useAppDispatch`) instead of raw `useSelector`/`useDispatch`.

### UI: Material UI v5

- Theme defined in `src/main.tsx` (primary `#1976d2`, secondary `#dc004e`)
- Components in `src/components/` each have an `index.ts` re-export
- `IngredientSelector` reads from Redux and dispatches `toggleIngredient(id)`
- `DishList` triggers dish search when selected ingredients change
- `RecipeView` fetches full recipe (with steps + per-recipe ingredient quantities) when a dish is selected

### Key data flow

1. App init → требуется Supabase → `fetchIngredients()` → Supabase `ingredients` → Redux
2. User selects ingredients → `toggleIngredient(id)` → `selectedIngredients[]` updated
3. "Find dishes" / фото → `searchGlobalRecipesByIngredients(selectedNames)` → Supabase `global_recipes` → `addAIDish` в Redux (карточки с отрицательными id)
4. User picks dish → рецепт уже в `aiDishRecipes[dishId]` или загружается `getGlobalRecipeById(id)` при выборе из поиска по названию → `AIRecipeView`

### TypeScript types (`src/types/`)

- `Ingredient` — with `IngredientCategory` union type
- `Dish` — with `difficulty` union
- `Recipe` — contains `RecipeStep[]` (parsed from JSON) and `RecipeIngredient[]`
- All exported from `src/types/index.ts`
