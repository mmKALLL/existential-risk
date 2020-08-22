import {
  initialGameState,
  GameState,
  Rectangle,
  MouseBuffer,
  initialMouseBuffer,
} from './types'

/**
 * Constants
 */

const constants = {
  FPS: 30,
}

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

/**
 * Game loop
 */

function startGame() {
  const timePerFrame = 1000 / constants.FPS
  const yearLengthMillis = 120 * 1000 // 2 minutes
  const nextDayMillis = (timeAfterAdvanceMillis: number): number =>
    yearLengthMillis / 365 - timeAfterAdvanceMillis
  let timeUntilDayAdvance = nextDayMillis(0)

  let gs: GameState = initialGameState() // Game state
  const mouseBuffer: MouseBuffer = initialMouseBuffer()

  setInterval(() => {
    timeUntilDayAdvance -= timePerFrame
    if (timeUntilDayAdvance < 0) {
      timeUntilDayAdvance = nextDayMillis(timeUntilDayAdvance)
      gs = advanceDay(gs)
    }

    handleMouseEvents(gs, mouseBuffer)

    render(gs, mouseBuffer)
  }, timePerFrame)

  // Event handlers
  // Get mouse position and store it in gameState
  canvas.addEventListener('mousemove', event => {
    let bound = canvas.getBoundingClientRect()

    mouseBuffer.lastMouseX = event.clientX - bound.left - canvas.clientLeft
    mouseBuffer.lastMouseY = event.clientY - bound.top - canvas.clientTop
  })
}

/**
 * Game state handling
 */

function advanceDay(gs: GameState): GameState {
  return { ...gs, day: gs.day + 1 }
}

function handleMouseEvents(gs: GameState, mouseBuffer: MouseBuffer) {
  // TODO

  // Cleanup
  mouseBuffer.click = undefined
  mouseBuffer.rightClick = undefined
}


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
