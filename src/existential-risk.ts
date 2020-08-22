const ctx = (document.getElementById(
  'gameCanvas'
) as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D

ctx.beginPath()
ctx.rect(20, 20, 150, 100)
ctx.stroke()

let i = 0
const interval = setInterval(() => {
  for (let x = i; x < 1400; x += 5) {
    for (let y = i; y < 900; y += 5) {
      ctx.beginPath()
      ctx.strokeStyle = `rgb(
        ${Math.floor(255 - x / 5)},
        ${Math.floor(255 - x / 5)},
        ${Math.floor(255 - y / 4)})`
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      ctx.stroke()
/**
 * Start loading the images
 */

const loadImage = (name: string) => {
  const image: HTMLImageElement & { ready?: boolean } = new Image()
  image.src = 'assets/' + name + '.png'
  image.onload = () => (image.ready = true)
  return image
}

function areImagesLoaded() {
  return Object.values(images).every(image => image.ready)
}

const images = {
  continents1: loadImage('continents1'),
  continents2: loadImage('continents2'),
}

/**
 * Once images are loaded, start the game!
 */
const imageLoader = setInterval(() => {
  console.log(images.continents1.outerHTML)
  console.log('not yet')
  if (areImagesLoaded()) {
    console.log('OK!')
    clearInterval(imageLoader)
    startGame()
  }
}, 200)
