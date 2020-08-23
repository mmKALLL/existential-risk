import { initialGameState, GameState, ContinentSection } from './types'
import { render, getContinentWithinCoordinate } from './render'

/**
 * Constants
 */

export const constants = {
  // Internal stuff
  FPS: 30,
  yearLengthMillis: 120 * 1000, // 2 minutes
  maxPopulation: Math.pow(10, 10), // 10 billion is max for one continent, no matter what

  // Rendering stuff
  mapWidth: 1400,
  topPanelHeight: 55,
  topPanelBorderWidth: 4,
  fontSize: 14,
  lineHeight: 20,
}

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

// Set up the pixel ratio. Super important for getting sharp canvas output on high-DPI displays.
const setupCanvas = () => {
  const width = canvas.width
  const height = canvas.height
  const ratio = window.devicePixelRatio
  canvas.width = width * ratio
  canvas.height = height * ratio
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
}

/**
 * Game loop
 */

function startGame() {
  const timePerFrame = 1000 / constants.FPS
  const nextDayMillis = (timeAfterAdvanceMillis: number): number =>
    constants.yearLengthMillis / 365 - timeAfterAdvanceMillis
  let timeUntilDayAdvance = nextDayMillis(0)

  let gs: GameState = initialGameState() // Game state

  setInterval(() => {
    timeUntilDayAdvance -= timePerFrame
    if (timeUntilDayAdvance < 0) {
      timeUntilDayAdvance = nextDayMillis(timeUntilDayAdvance)
      gs = advanceDay(gs)
    }

    render(gs, images)
  }, timePerFrame)

  // Event handlers
  // Get mouse position and store it in game state
  canvas.addEventListener('mousemove', event => {
    const bound = canvas.getBoundingClientRect()

    gs.lastMouseX = event.clientX - bound.left - canvas.clientLeft
    gs.lastMouseY = event.clientY - bound.top - canvas.clientTop
  })

  // On left click store selected continent in game state (clicking outside any continent but within map clears selection)
  canvas.addEventListener('mousedown', event => {
    const bound = canvas.getBoundingClientRect()

    const x = event.clientX - bound.left - canvas.clientLeft
    const y = event.clientY - bound.top - canvas.clientTop

    if (x < constants.topPanelHeight || y > constants.mapWidth) {
      // TODO: Handle UI button actions
    } else {
      // Handle map selections
      gs.selectedContinent = getContinentWithinCoordinate(gs, [x, y])
    }
  })

  // Also clear selection on right click
}

/**
 * Game state handling
 */

function advanceDay(gs: GameState): GameState {
  let nextState = {
    ...gs,
    day: gs.day + 1,
    co2ppm: gs.co2ppm + gs.co2ppmDelta / 365,
    globalTempDiff: gs.globalTempDiff + gs.globalTempDiffDelta / 365,
    continentSections: gs.continentSections.map(cs =>
      updateContinentSection(gs, cs)
    ),
  }

  nextState = calculateEmigrations(nextState)
  nextState = calculateIndices(nextState)

  return nextState
}

const updateContinentSection = (
  gs: GameState,
  cs: ContinentSection
): ContinentSection => {
  // prettier-ignore
  const newPopulation =
    clamp(
      0, constants.maxPopulation,
      cs.totalPopulation
        + ((cs.totalPopulation * cs.birthRate / 1000) // births
        - (cs.totalPopulation / cs.lifeExpectancy) // natural deaths
        - (cs.totalPopulation / 10000 * Math.pow(2.3, cs.conflictLevel)) // deaths from conflicts - 1/10000 per year for conflict level 1, 1/10 per year for conflict level 8
        - (cs.totalPopulation / 1000 * Math.pow(cs.diseaseIndex / 5, 2))  // deaths from disease - index 10 => 4/1000 per year, 20 => 16/1000, 30 => 36/1000, 50 => 100/1000, 100 => 400/1000
      / 365) // calculate subtotal per day instead of year
    )

  const birthRate = clamp(0, 100, cs.birthRate + cs.birthRateDelta / 365)
  const lifeExpectancy = clamp(
    15,
    250,
    cs.lifeExpectancy + cs.lifeExpectancyDelta / 365
  )
  const GDPCapita = clamp(
    500,
    Math.pow(10, 10),
    cs.GDPCapita * (1 + cs.GDPCapitaMultiplier / 365)
  )
  const happiness = clamp(0, 10, cs.happiness + cs.happinessDelta / 365)
  const happinessDelta = cs.happinessDelta // TODO

  // prettier-ignore
  const conflictLevel = clamp(0, 10,
    cs.conflictLevel
      + (6.5 - happiness) / 365 // increase conflict by 1/year when happiness = 5.5, 2/year when = 4.5, etc; higher happiness decreases conflict
  )

  const financeIndex = calculateFinanceIndex(GDPCapita)
  // {
  //   name: 'Africa',
  //   totalPopulation: 1340598147,
  //   birthRate: 35.91,
  //   birthRateDelta: -0.41,
  //   lifeExpectancy: 63.2,
  //   lifeExpectancyDelta: 0.46,
  //   GDPCapita: 1930,
  //   GDPCapitaMultiplier: 1.036,
  //   happiness: 4.571100235,
  //   happinessDelta: 0.0304200469,
  //   foodIndex: 7.1,
  //   financeIndex: 0.2,
  //   educationIndex: 0,
  //   techIndex: 0,
  //   techIndexDelta: 0,
  //   diseaseIndex: 0,
  //   conflictLevel: 0,
  //   globalTempDiffSensitivity: 3.6,
  //   subRegions: [],
  //   neighbors: ['Europe', 'Asia', 'South America', 'Antarctica'],
  //   xywh: [590, 380, 210, 280],
  // },

  return {
    ...cs,
    totalPopulation: newPopulation,
    birthRate,
    lifeExpectancy,
    GDPCapita,
    happiness,
    happinessDelta,

    financeIndex,

    conflictLevel,
  }
}

const calculateEmigrations = (gs: GameState): GameState => {
  // TODO
  return gs
}

// once-in-a-year adjustment
const calculateIndices = (gs: GameState): GameState => {
  // TODO: Update foodIndex, financeIndex, educationIndex, and techIndex for each CS
  // TODO: Update deltas for GS values
  return gs
}

/**
 * Utilities
 */

// financeIndex = 0.0000008 x^(4.1) - 0.0000078 x^(3.5) - 0.005 x^(2.3) + 0.016 x^(2) + 0.175 x - 0.17, and 10 when x>70
const calculateFinanceIndex = (GDPCapita: number): number => {
  const x = GDPCapita / 1000
  const polynomialTerm = (constant: number, coefficient: number): number =>
    constant * Math.pow(x, coefficient)

  if (x > 70) {
    return 10.0
  } else {
    return (
      polynomialTerm(0.0000008, 4.1) +
      polynomialTerm(-0.0000078, 3.5) +
      polynomialTerm(-0.005, 2.3) +
      polynomialTerm(0.016, 2) +
      polynomialTerm(0.175, 1) +
      -0.17
    )
  }
}

// Restrict a number between a min/max
const clamp = (min: number, max: number, number: number): number => {
  return Math.min(max, Math.max(min, number))
}

const sum = (array: number[]): number => {
  return array.reduce((a, b) => a + b)
}

// Explicitly check that all inferred types are used - e.g. in a switch statement
function assertNever(x: never): never {
  throw new Error(`Unexpected object in assertNever:\n  ${x}`)
}

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
    setupCanvas()
    startGame()
  }
}, 200)
