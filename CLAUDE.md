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

**What2Eat** ("ЧтоЕсть") is a meal planning React SPA for a couple. The UI is in Russian. It runs entirely in the browser — no backend, no network requests.

### Data layer: sql.js (SQLite via WebAssembly)

- `src/services/database.ts` — initializes the SQLite DB using sql.js; exposes `getDatabase()` used by all other services
- The DB is loaded from `database/schema.sql` at startup; seed data populates ingredients, dishes, and recipes
- All queries use parameterized statements (`db.prepare(...).bind([...])`) to avoid SQL injection
- `recipe.instructions` is stored as a JSON string and parsed at read time

### DB schema (5 tables)

- `ingredients` — id, name, category (`meat|cereals|vegetables|dairy|spices|other`), image_url
- `dishes` — id, name, description, image_url, cooking_time (minutes), difficulty (`easy|medium|hard`), servings
- `dish_ingredients` — many-to-many join between dishes and ingredients (used for search)
- `recipes` — one-to-one with dishes; `instructions` is a JSON array of `RecipeStep`
- `recipe_ingredients` — per-recipe ingredient quantities (ingredient_id, quantity, unit)

### Service layer (`src/services/`)

- `ingredients.ts` — `getAllIngredients`, `getIngredientsByCategory`, `searchIngredients`
- `recipes.ts` — `getRecipeByDishId` (joins recipes + dishes + recipe_ingredients in one query)
- `dishes.ts` — dish search by ingredient IDs (ranks by match count, returns up to 5 results)

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

1. App init → `fetchIngredients` thunk → `ingredientsService.getAllIngredients()` → SQLite → Redux
2. User selects ingredients → `toggleIngredient(id)` dispatched → `selectedIngredients[]` updated
3. "Find dishes" → `dishesService.findDishesByIngredients(selectedIngredients)` → SQL COUNT match → top 5 results
4. User picks dish → `getRecipeByDishId(dishId)` → full Recipe object → `RecipeView`

### TypeScript types (`src/types/`)

- `Ingredient` — with `IngredientCategory` union type
- `Dish` — with `difficulty` union
- `Recipe` — contains `RecipeStep[]` (parsed from JSON) and `RecipeIngredient[]`
- All exported from `src/types/index.ts`
