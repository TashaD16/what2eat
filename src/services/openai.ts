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
  if (!key) throw new Error('VITE_OPENAI_API_KEY не задан в .env.local')
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
