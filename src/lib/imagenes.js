// Procesamiento de imágenes antes de subirlas.
//
// Resuelve tres problemas reales que veníamos teniendo con las evidencias:
//  1. Fotos HEIC de iPhone: ningún navegador las muestra, así que la evidencia
//     llegaba "sin imagen". Aquí se convierten a JPG (o se rechazan con un
//     mensaje claro si el navegador no sabe decodificarlas).
//  2. Fotos de 3–4 MB en conexiones rurales: la subida tardaba minutos y el
//     estudiante creía que había fallado. Se reducen a ~1600 px / JPG.
//  3. Archivos que no son imagen colados por el selector.

export const MAX_BYTES_ORIGINAL = 30 * 1024 * 1024 // 30 MB antes de comprimir
const MAX_LADO = 1600
const CALIDAD_JPEG = 0.82

export function formatearMB(bytes) {
  const mb = bytes / (1024 * 1024)
  return mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)
}

function esHeic(file) {
  const nombre = (file.name || '').toLowerCase()
  return /heic|heif/.test(file.type || '') || /\.(heic|heif)$/.test(nombre)
}

async function decodificar(file) {
  // createImageBitmap respeta la orientación EXIF, así que las fotos tomadas
  // de lado no quedan giradas.
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // Algunos navegadores no aceptan las opciones; se reintenta sin ellas.
      try {
        return await createImageBitmap(file)
      } catch {
        /* se intenta con <img> abajo */
      }
    }
  }

  const url = URL.createObjectURL(file)
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('decode'))
      img.src = url
    })
  } finally {
    // El navegador ya tiene los píxeles; liberar la URL es seguro.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

function nombreJpg(nombreOriginal) {
  const base = (nombreOriginal || 'foto').replace(/\.[^.]+$/, '')
  // Solo caracteres seguros: el nombre viaja en la URL pública del bucket.
  const limpio = base.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  return `${limpio || 'foto'}.jpg`
}

/**
 * Convierte y comprime una imagen a JPG.
 * @returns {Promise<File>} archivo listo para subir
 * @throws {Error} con un mensaje en español apto para mostrarle al usuario
 */
export async function procesarImagen(file) {
  if (!file.type.startsWith('image/') && !esHeic(file)) {
    throw new Error(`"${file.name}" no es una imagen.`)
  }

  if (file.size > MAX_BYTES_ORIGINAL) {
    throw new Error(
      `"${file.name}" pesa ${formatearMB(file.size)} MB y es demasiado grande. Tómala de nuevo con menor resolución.`
    )
  }

  let bitmap
  try {
    bitmap = await decodificar(file)
  } catch {
    if (esHeic(file)) {
      throw new Error(
        `"${file.name}" está en formato HEIC y este dispositivo no puede convertirla. ` +
        `En tu iPhone entra a Ajustes › Cámara › Formatos y elige "Más compatible", o comparte la foto por WhatsApp y súbela desde ahí.`
      )
    }
    throw new Error(`No se pudo leer "${file.name}". Intenta con otra foto.`)
  }

  const ancho = bitmap.width || bitmap.naturalWidth
  const alto = bitmap.height || bitmap.naturalHeight
  if (!ancho || !alto) throw new Error(`No se pudo leer "${file.name}". Intenta con otra foto.`)

  const escala = Math.min(1, MAX_LADO / Math.max(ancho, alto))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(ancho * escala)
  canvas.height = Math.round(alto * escala)

  const ctx = canvas.getContext('2d')
  // Fondo blanco: los PNG con transparencia quedarían negros al pasar a JPG.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  if (bitmap.close) bitmap.close()

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', CALIDAD_JPEG))
  if (!blob) throw new Error(`No se pudo procesar "${file.name}". Intenta con otra foto.`)

  return new File([blob], nombreJpg(file.name), { type: 'image/jpeg', lastModified: Date.now() })
}

/** Procesa varias imágenes y devuelve las que sirvieron junto con los errores. */
export async function procesarImagenes(files) {
  const ok = []
  const errores = []
  for (const file of files) {
    try {
      ok.push(await procesarImagen(file))
    } catch (e) {
      errores.push(e.message)
    }
  }
  return { ok, errores }
}

/** Una URL de video guardada puede ser un enlace externo (YouTube, Drive...) o un archivo del bucket. */
export function esEnlaceExterno(url) {
  return typeof url === 'string' && !/\/storage\/v1\/object\/public\//.test(url)
}

export function esImagenNoVisible(url) {
  return typeof url === 'string' && /\.(heic|heif)(\?|$)/i.test(url)
}
