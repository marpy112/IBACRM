export async function prepareResearcherPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP photo.');
  }
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose a photo smaller than 10 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 400;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not process this photo.');
    const side = Math.min(bitmap.width, bitmap.height);
    context.fillStyle = '#fff';
    context.fillRect(0, 0, 400, 400);
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 400, 400);
    const photo = canvas.toDataURL('image/jpeg', 0.8);
    if (photo.length > 250000) throw new Error('This photo is too detailed. Please choose a smaller image.');
    return photo;
  } finally {
    bitmap.close();
  }
}
