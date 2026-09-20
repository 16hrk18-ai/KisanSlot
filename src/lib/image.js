// Firebase Cloud Storage needs a billing account enabled these days,
// even for free-tier usage. To keep this feature completely free, we
// compress the photo in the browser and store it as a data URL directly
// on the booking document instead — Firestore documents cap at 1MiB,
// so we resize aggressively and use JPEG compression to stay well under.
export function compressImageFile(file, { maxWidth = 480, quality = 0.55 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not read that image.'))
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
