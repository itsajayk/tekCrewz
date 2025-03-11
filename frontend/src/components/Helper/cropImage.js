// cropImage.js
export const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });
  
  export default async function getCroppedImg(imageSrc, pixelCrop, fileName) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
  
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          console.error('Canvas is empty');
          return reject(new Error('Canvas is empty'));
        }
        blob.name = fileName;
        const fileUrl = window.URL.createObjectURL(blob);
        resolve({ blob, fileUrl });
      }, 'image/jpeg');
    });
  }
  