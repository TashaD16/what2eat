# История разработки what2eat

## Сессия 10.03.2026

---

### 1. Сохранение лайков в Supabase (favorite_recipes)

**Задача:** при лайке сохранять рецепт в `favorite_recipes`, при исключении — удалять.

**Анализ:** логика частично была реализована — `addFavoriteLocalDish` / `removeFavoriteLocalDish` вызывались при `likeDish` и `unlikeDish`, но при левом свайпе (`swipeDish` direction='left') удаление из базы не происходило.

**Исправление в `src/store/slices/swipeSlice.ts`:**
```ts
} else {
  if (!state.dislikedDishIds.includes(dishId)) {
    state.dislikedDishIds.push(dishId)
  }
  // Remove from favorites if previously liked
  if (state.likedDishIds.includes(dishId)) {
    state.likedDishIds = state.likedDishIds.filter((id) => id !== dishId)
    saveLikedIds(state.likedDishIds)
    if (userId) removeFavoriteLocalDish(userId, dishId)
  }
}
```

**Итоговая таблица:**

| Действие | likedDishIds | Supabase favorite_recipes |
|---|---|---|
| Свайп вправо (лайк) | добавляет | upsert — сохраняет |
| Свайп влево (исключение) | удаляет (если был лайк) | delete — удаляет |
| Кнопка лайка в RecipeView/AIRecipeView | добавляет | upsert — сохраняет |
| Кнопка Unlike | удаляет | delete — удаляет |

---

### 2. Авторизация через Google перед доступом к функционалу

**Задача:** требовать вход перед использованием приложения.

**Изменения:**

#### `src/store/slices/authSlice.ts`
- Добавлен флаг `initialized: boolean` в `AuthState`
- Устанавливается в `true` после `initAuth.fulfilled` и `initAuth.rejected`
- Добавлен `redirectTo: window.location.origin` в `signInWithGoogle`

```ts
interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  initialized: boolean  // новое
}
```

#### `src/components/Auth/LoginScreen.tsx` (новый файл)
Полноэкранный компонент входа:
- Кнопка «Войти через Google» (основная)
- Email/пароль форма ниже
- Переключение вход ↔ регистрация

#### `src/App.tsx`
Добавлена цепочка проверок до рендера основного приложения:
```
БД загружается → initAuth ждёт → нет user → LoginScreen
                                  → есть user → приложение
```

```tsx
// Ждём инициализацию auth
if (!authInitialized) {
  return <CircularProgress />
}

// Требуем вход
if (!user) {
  return <LoginScreen />
}
```

---

### 3. Замена названия

«ЧтоЕсть» заменено на «what2eat» в заголовке `LoginScreen`.

---

### 4. Настройка Google OAuth в Supabase

#### Google Cloud Console

1. **APIs & Services → Credentials → Create OAuth client ID**
2. **Authorized JavaScript origins:**
   - `http://localhost:5173`
   - `http://localhost`
3. **Authorized redirect URIs:**
   - `https://siaaptnnchaafzygxugc.supabase.co/auth/v1/callback`

#### Supabase Dashboard (siaaptnnchaafzygxugc.supabase.co)

**Authentication → Providers → Google:**
- Включить тоггл
- Вставить Client ID и Client Secret из Google Cloud Console

**Authentication → URL Configuration:**
- Site URL: `http://localhost:5173`
- Redirect URLs: `http://localhost:5173`, `http://localhost:5173/**`

#### Схема потока авторизации
```
Браузер (localhost:5173)
  → нажимает "Войти через Google"
  → Supabase проверяет: localhost:5173 есть в Redirect URLs? ✓
  → редиректит на Google
  → Google проверяет: localhost:5173 есть в Authorized JS origins? ✓
  → пользователь входит
  → Google редиректит на: siaaptnnchaafzygxugc.supabase.co/auth/v1/callback
  → Supabase обрабатывает токен
  → редиректит обратно на localhost:5173
  → приложение открывается
```

---

### Коммиты

| Хэш | Ветка | Описание |
|-----|-------|----------|
| `97f6e8a` | main, 0903-auth-stripe | Add Google auth gate and fix swipe favorites sync |
| `349013a` | main | Replace ЧтоЕсть with what2eat in LoginScreen title |
