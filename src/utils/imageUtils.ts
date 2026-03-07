import heic2any from 'heic2any'

/** Максимальная сторона изображения для API (OpenAI принимает, но большие файлы дают 400 при лимитах). */
const MAX_IMAGE_SIDE = 1024
const JPEG_QUALITY = 0.85

function isHeic(file: File): boolean {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.heic$/i.test(file.name) ||
    /\.heif$/i.test(file.name)
  )
}

/**
 * Конвертирует HEIC/HEIF (фото с iPhone) в JPEG через heic2any.
 */
export async function convertHeicToJpegFile(file: File): Promise<File> {
  const blob = await heic2any({
    blob: file,
    toType: 'image/jpeg',
  })
  const jpegBlob = Array.isArray(blob) ? blob[0] : blob
  if (!jpegBlob || !(jpegBlob instanceof Blob)) {
    throw new Error('Не удалось конвертировать HEIC')
  }
  return new File([jpegBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
    type: 'image/jpeg',
  })
}

/**
 * Подготавливает фото для отправки в OpenAI: конвертирует HEIC в JPEG, сжимает и уменьшает.
 * iPhone часто отдаёт HEIC — API его не поддерживает; HEIC сначала конвертируется через heic2any.
 */
export async function prepareImageForApi(file: File): Promise<{ base64: string; mimeType: string }> {
  let fileToUse = file
  if (isHeic(file)) {
    fileToUse = await convertHeicToJpegFile(file)
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileToUse)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      URL.revokeObjectURL(url)
      const w = img.naturalWidth
      const h = img.naturalHeight
      let dw = w
      let dh = h
      if (w > MAX_IMAGE_SIDE || h > MAX_IMAGE_SIDE) {
        if (w >= h) {
          dw = MAX_IMAGE_SIDE
          dh = Math.round((h * MAX_IMAGE_SIDE) / w)
        } else {
          dh = MAX_IMAGE_SIDE
          dw = Math.round((w * MAX_IMAGE_SIDE) / h)
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = dw
      canvas.height = dh
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(img, 0, 0, dw, dh)
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      const base64 = dataUrl.split(',')[1]
      if (!base64) {
        reject(new Error('Failed to encode image'))
        return
      }
      resolve({ base64, mimeType: 'image/jpeg' })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Не удалось загрузить изображение'))
    }
    img.src = url
  })
}

export { isHeic }

// Словарь переводов названий блюд для улучшения поиска фото
const DISH_TRANSLATIONS: Record<string, string> = {
  'борщ': 'borscht soup',
  'щи': 'shchi cabbage soup',
  'солянка': 'solyanka soup',
  'окрошка': 'okroshka cold soup',
  'рассольник': 'rassolnik soup',
  'пельмени': 'pelmeni dumplings',
  'вареники': 'vareniki dumplings',
  'блины': 'blini pancakes',
  'оладьи': 'russian pancakes',
  'сырники': 'cottage cheese pancakes',
  'котлеты': 'meat patties',
  'тефтели': 'meatballs',
  'голубцы': 'stuffed cabbage rolls',
  'плов': 'pilaf rice',
  'ризотто': 'risotto',
  'паста': 'pasta dish',
  'пицца': 'pizza',
  'лазанья': 'lasagna',
  'суп': 'soup',
  'каша': 'porridge',
  'гречка': 'buckwheat',
  'картофель': 'potato dish',
  'картошка': 'potato dish',
  'курица': 'chicken dish',
  'говядина': 'beef dish',
  'свинина': 'pork dish',
  'рыба': 'fish dish',
  'семга': 'salmon dish',
  'лосось': 'salmon dish',
  'креветки': 'shrimp dish',
  'омлет': 'omelette',
  'яичница': 'fried eggs',
  'салат': 'salad',
  'оливье': 'olivier salad',
  'винегрет': 'vinaigrette salad',
  'жаркое': 'roast meat',
  'шашлык': 'shashlik kebab',
  'стейк': 'steak',
  'отбивная': 'pork chop',
  'запеканка': 'casserole',
  'пирог': 'pie',
  'пирожки': 'stuffed buns',
  'хлеб': 'bread',
  'торт': 'cake',
  'чизкейк': 'cheesecake',
  'мусс': 'mousse dessert',
  'компот': 'fruit compote',
}

function dishNameToPhotoKeyword(dishName: string): string {
  const lower = dishName.toLowerCase()
  for (const [ru, en] of Object.entries(DISH_TRANSLATIONS)) {
    if (lower.includes(ru)) return en
  }
  // Fallback: use the original name (Unsplash handles Cyrillic)
  return dishName
}

export function getDishImageUrl(dishName: string, imageUrl: string | null | undefined): string {
  if (imageUrl) return imageUrl
  const keyword = dishNameToPhotoKeyword(dishName)
  return `https://source.unsplash.com/featured/600x400/?food,recipe,${encodeURIComponent(keyword)}`
}

