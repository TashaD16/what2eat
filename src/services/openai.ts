export interface CalorieEstimate {
  calories: number
  protein: number
  fat: number
  carbs: number
  description: string
}

const API_URL = 'https://api.openai.com/v1/chat/completions'

function getApiKey(): string {
  const key = import.meta.env.VITE_OPENAI_API_KEY
  if (!key)
    throw new Error(
      'Для распознавания по фото задайте переменную VITE_OPENAI_API_KEY в настройках проекта (Vercel: Settings → Environment Variables).'
    )
  return key
}

export async function detectIngredientsFromImage(
  base64: string,
  mimeType: string,
  ingredientNames: string[]
): Promise<string[]> {
  const prompt = `Ты видишь фото продуктов или холодильника.
Из следующего списка ингредиентов выбери только те, что ты видишь на фото:
${ingredientNames.join(', ')}

Верни ТОЛЬКО JSON массив с именами найденных ингредиентов, без пояснений.
Пример: ["Курица", "Морковь", "Молоко"]
Если ничего не найдено, верни: []`

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'low' },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI API error: ${response.status} — ${err}`)
  }

  const data = await response.json()
  const text: string = data.choices?.[0]?.message?.content ?? '[]'
  try {
    const match = text.match(/\[[\s\S]*\]/)
    return match ? (JSON.parse(match[0]) as string[]) : []
  } catch {
    return []
  }
}

export async function estimateCaloriesFromImage(
  base64: string,
  mimeType: string
): Promise<CalorieEstimate> {
  const prompt = `Посмотри на фото блюда или продукта и оцени его питательную ценность на одну порцию.
Верни ТОЛЬКО JSON объект в формате:
{"calories": <число>, "protein": <г>, "fat": <г>, "carbs": <г>, "description": "<краткое описание блюда на русском>"}
Без пояснений, только JSON.`

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'low' },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI API error: ${response.status} — ${err}`)
  }

  const data = await response.json()
  const text: string = data.choices?.[0]?.message?.content ?? '{}'
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as CalorieEstimate
  } catch {
    // fall through
  }
  return { calories: 0, protein: 0, fat: 0, carbs: 0, description: 'Не удалось определить' }
}

export interface PopularDishSuggestion {
  name: string
  description: string
  mainIngredients: string[]
  cookingTime: string
}

/**
 * Возвращает 5 популярных блюд из интернета (без привязки к конкретным ингредиентам).
 */
export async function fetchPopularDishes(): Promise<PopularDishSuggestion[]> {
  const prompt = `Назови 5 популярных блюд, которые часто готовят дома. Верни ТОЛЬКО JSON массив объектов:
[{"name":"<название на русском>","description":"<1–2 предложения, почему вкусно>","mainIngredients":["<ing1>","<ing2>","<ing3>"],"cookingTime":"<напр. 30 мин>"}]
Без пояснений, только JSON.`

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!response.ok) return []
    const data = await response.json()
    const text: string = data.choices?.[0]?.message?.content ?? '[]'
    const match = text.match(/\[[\s\S]*?\]/)
    if (!match) return []
    const arr = JSON.parse(match[0]) as unknown
    if (!Array.isArray(arr)) return []
    return arr
      .filter(
        (x): x is PopularDishSuggestion =>
          typeof x === 'object' &&
          x !== null &&
          typeof (x as PopularDishSuggestion).name === 'string' &&
          typeof (x as PopularDishSuggestion).description === 'string'
      )
      .slice(0, 5)
  } catch {
    return []
  }
}

/**
 * Предлагает 3–5 блюд по списку ингредиентов (когда в базе ничего не нашли).
 */
export async function suggestDishesByIngredients(ingredientNames: string[]): Promise<string[]> {
  if (ingredientNames.length === 0) return []
  const prompt = `Есть продукты: ${ingredientNames.join(', ')}.
Предложи 3–5 простых блюд, которые можно приготовить из этих продуктов (можно не все использовать).
Верни ТОЛЬКО JSON массив строк с названиями блюд на русском, без пояснений.
Пример: ["Яичница с сыром", "Омлет с овощами"]`

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!response.ok) return []
    const data = await response.json()
    const text: string = data.choices?.[0]?.message?.content ?? '[]'
    const match = text.match(/\[[\s\S]*?\]/)
    if (!match) return []
    const arr = JSON.parse(match[0]) as unknown
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string').slice(0, 5) : []
  } catch {
    return []
  }
}
