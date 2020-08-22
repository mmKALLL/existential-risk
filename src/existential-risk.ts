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

/**
 * Drawing functions
 */

function render(state: GameState, mouseBuffer: MouseBuffer) {
  clearCanvas()
  drawBackground()
  drawContinents(state)
  drawUIComponents(mouseBuffer)
}

function clearCanvas() {
  ctx.clearRect(0, 0, 1400, 900)
}

function drawBackground() {
  // Draw continental background
  ctx.globalAlpha = 0.65
  ctx.drawImage(images.continents2, 0, 90, 1370, 700)
  ctx.globalAlpha = 1
}

function drawContinents(state: GameState) {
  // Set up the drawing
  ctx.beginPath()
  useContinentBorder()

  // Draw lines between neighboring continents
  state.continentSections.forEach(cs => {
    cs.neighbors.forEach(name => {
      const neighbor = getContinent(state, name)
      if (neighbor) {
        if (!isPacificConnection(name, neighbor.name)) {
          ctx.beginPath()
          ctx.moveTo(...xywhCenter(cs.xywh))
          ctx.lineTo(...xywhCenter(neighbor.xywh))
          ctx.stroke()
        }
      }
    })
  })

  // Draw NA-Asia connections across the pacific
  ctx.moveTo(...xywhCenter(getContinent(state, 'North America')!.xywh))
  ctx.lineTo(0, continentMidCoordinate(state, 'North America', 'Asia').y)

  ctx.moveTo(...xywhCenter(getContinent(state, 'North America')!.xywh))
  ctx.lineTo(0, continentMidCoordinate(state, 'North America', 'Russia').y)

  // Draw Asia-NA connections across the pacific
  ctx.moveTo(...xywhCenter(getContinent(state, 'Asia')!.xywh))
  ctx.lineTo(1400, continentMidCoordinate(state, 'North America', 'Asia').y)

  ctx.moveTo(...xywhCenter(getContinent(state, 'Russia')!.xywh))
  ctx.lineTo(1400, continentMidCoordinate(state, 'North America', 'Russia').y)

  // Finish the path and draw everything in one shot
  ctx.stroke()

  // debug: Draw the continent bounding boxes
  state.continentSections.forEach(cs => {
    ctx.strokeRect(...cs.xywh)
  })
}

function drawUIComponents(mouseBuffer: MouseBuffer) {
  const strokeOffset = constants.topPanelBorderWidth / 2
  const drawTopBarComponentBorder = (
    rightEdgeX: number,
    width: number,
    height: number
  ) => {
    ctx.beginPath()
    usePanelBorder()
    const rect: Rectangle = [
      rightEdgeX - width - strokeOffset,
      strokeOffset,
      width,
      height,
    ]
    ctx.clearRect(...rect)
    ctx.rect(...rect)
    ctx.stroke()
  }

  ctx.beginPath()

  // Top panel
  drawTopBarComponentBorder(1600, 1600, 50)

  // Graphs and stuff? - the box. Starts from far right edge
  drawTopBarComponentBorder(1600, 200, 900 - strokeOffset * 4)

  // Top-right status box. Starts from graph box.
  const statusBoxWidth = 350
  const statusBoxHeight = 150
  drawTopBarComponentBorder(1400, statusBoxWidth, statusBoxHeight)

  // Status box texts
  useText()
  ctx.fillText(
    'World stats (average):',
    1400 - statusBoxWidth + 10,
    10 + strokeOffset,
    statusBoxWidth - 30
  )

  // debug
  useText()
  ctx.fillText(
    `Mouse point: (${mouseBuffer.lastMouseX}, ${mouseBuffer.lastMouseY})`,
    10,
    10 + strokeOffset
  )

  ctx.stroke() // finish the path and draw the texts (and anything that's missing)
}

function useText() {
  ctx.strokeStyle = '#101'
  ctx.lineWidth = 1
  ctx.textBaseline = 'top'
}

function usePanelBorder() {
  ctx.strokeStyle = '#101'
  ctx.lineWidth = constants.topPanelBorderWidth
}

function useContinentBorder() {
  ctx.strokeStyle = '#101'
  ctx.lineWidth = 2
}

const randomRGBStyle = (): string =>
  `rgb(${255 * Math.random()},${255 * Math.random()},${255 * Math.random()})`

/**
 * Utilities
 */

// Return x-y tuple of an rectangle's center point
const xywhCenter = (xywh: Rectangle): [number, number] => [
  xywh[0] + xywh[2] / 2, // x + width / 2
  xywh[1] + xywh[3] / 2, // y + height / 2
]

const continentMidCoordinate = (
  state: GameState,
  name1: ContinentName,
  name2: ContinentName
): Coordinate => ({
  x:
    (xywhCenter(getContinent(state, name1)!.xywh)[0] +
      xywhCenter(getContinent(state, name2)!.xywh)[0]) /
    2,
  y:
    (xywhCenter(getContinent(state, name1)!.xywh)[1] +
      xywhCenter(getContinent(state, name2)!.xywh)[1]) /
    2,
})

const getContinent = (state: GameState, name: ContinentName) =>
  state.continentSections.find(cs => cs.name === name)

// Check if the connection crosses the pacific ocean, i.e. connection lines need to wrap the edges
const isPacificConnection = (
  name1: ContinentName,
  name2: ContinentName
): boolean =>
  (name1 === 'North America' && (name2 === 'Asia' || name2 === 'Russia')) ||
  (name2 === 'North America' && (name1 === 'Asia' || name1 === 'Russia'))

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
