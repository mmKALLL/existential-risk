import {
  initialGameState,
  GameState,
  ContinentSection,
  ContinentName,
  UIButton,
} from './types'
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
  buttonLeftX: 350,
  buttonSize: 40,
}

/**
 * Start loading the images and set up buttons/canvas
 */

type LoadableImage = HTMLImageElement & { ready?: boolean }

const loadImage = (name: string, format: 'png' | 'svg'): void => {
  const image: LoadableImage = new Image()
  image.src = 'assets/' + name + '.' + format
  image.onload = () => (image.ready = true)
  images[name] = image
}

function areImagesLoaded() {
  return Object.values(images).every(image => image.ready)
}

const images: { [k: string]: LoadableImage } = {}

loadImage('continents1', 'png')
loadImage('continents2', 'png')
loadImage('economy', 'svg')
loadImage('education', 'svg')
loadImage('finance', 'svg')
loadImage('peacekeeper', 'svg')
loadImage('renewable', 'svg')
loadImage('research', 'svg')

// Shown when a continent is selected in game state
export const UIButtons: UIButton[] = [
  {
    name: 'Economic boost',
    description: 'Provide money to a region to boost their economic growth.',
    additionalDescription:
      'Helps the economy grow, providing long-term benefits to happiness, education, and food stability.',
    icon: images.economy,
    costFunction: cs => 0,
    onClick: gs => gs,
  },
  {
    name: 'Financial boost',
    description: 'Provide money to a region as immediate financial relief.',
    additionalDescription:
      'Does little to help the economy grow, but can alleviate happiness and food stability in the short term.',
    icon: images.finance,
    costFunction: cs => 0,
    onClick: gs => gs,
  },
  {
    name: 'Education reform',
    description: 'Provide financial aid for having more schools and teachers.',
    additionalDescription:
      'Improves education, which over time decreases birth rate and increases finance/tech.',
    icon: images.education,
    costFunction: cs => 0,
    onClick: gs => gs,
  },
  {
    name: 'Research grant',
    description:
      'Begin a series of technological research projects in the region.',
    additionalDescription:
      'Boosts tech level based on current education level, with long-term effects in finance, health, and happiness.',
    icon: images.research,
    costFunction: cs => 0,
    onClick: gs => gs,
  },
  {
    name: 'Renewable energy grant',
    description:
      'Provide financial stimulus for improving the energy infrastructure.',
    additionalDescription:
      'Short-term financial boost and long-term improvement for global warming and happiness.',
    icon: images.renewable,
    costFunction: cs => 0,
    onClick: gs => gs,
  },
  {
    name: 'Peacekeepers',
    description: 'Send a group of peacekeepers and negotiators in the region.',
    additionalDescription:
      'Immediate decrease in conflict levels, providing relief in food and happiness and decreasing emigration.',
    icon: images.peacekeeper,
    costFunction: cs => 0,
    onClick: gs => gs,
  },
]

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
  let clickedButtons: UIButton[] = []

  setInterval(() => {
    // Perform button events on current state
    clickedButtons.forEach(button => (gs = button.onClick(gs)))
    clickedButtons = []

    // Advance state when day changes
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

    if (y < constants.topPanelHeight || x > constants.mapWidth) {
      // TODO: Add UI buttons to clickedButtons
    } else {
      // Handle map selections
      gs.selectedContinentName = getContinentWithinCoordinate(gs, [x, y])?.name
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
  nextState = calculateConflicts(nextState)
  nextState = calculateIndices(nextState)
  nextState = calculateEvents(nextState)

  return nextState
}

const updateContinentSection = (
  gs: GameState,
  cs: ContinentSection
): ContinentSection => {
  const populationRatio = cs.totalPopulation / cs.originalPopulation
  // prettier-ignore
  const populationDelta =
    ((cs.totalPopulation * cs.birthRate / 1000) // births
      - (cs.totalPopulation / cs.lifeExpectancy) // natural deaths
      - (cs.totalPopulation / 10000 * Math.pow(2.3, cs.conflictLevel)) // deaths from conflicts - 1/10000 per year for conflict level 1, 1/10 per year for conflict level 8
      - (cs.totalPopulation / 1000 * Math.pow(cs.diseaseIndex / 5, 2))  // deaths from disease - index 10 => 4/1000 per year, 20 => 16/1000, 30 => 36/1000, 50 => 100/1000, 100 => 400/1000
    ) / 365 // calculate subtotal per day instead of year
  const newPopulation = clamp(
    0,
    constants.maxPopulation,
    cs.totalPopulation + populationDelta
  )

  const birthRate = clamp(0, 100, cs.birthRate + cs.birthRateDelta / 365)
  // prettier-ignore
  const birthRateDelta = clamp(
    -10, 10,
    cs.birthRateDelta
      + ((cs.happiness - 6.5) / 300 // high happiness increases birthRate over time; low reduces it. 3.5=>-0.01, 5=>-0.005, 6.5=>0, 8=>0.005, 9.5=>0.01
      // + (cs.educationIndex) // high education decreases birthRate over time
      + (0.03 * (1 - populationRatio)) // population sizes tend to try to stay similar over time. TODO: Currently linear. Ideally the following Ratio to effect: 0.6=>0.01, 0.9=>0.005, 1.1=>-0.005, 1.4=>-0.01, 1.9=>-0.015
    ) / 365 // calculate subtotal per day instead of year
  )
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
  // TODO: GDPCapitaMultiplier similar to happinessDelta

  const happiness = clamp(0, 10, cs.happiness + cs.happinessDelta / 365)
  // prettier-ignore
  const happinessDelta =
    clamp(-2, 2,
      cs.happinessDelta
        + ((populationRatio > 0.7 ? (0.8 - populationRatio ) * 0.001 : 0.004) // overpopulation effects and main happinessDelta influence
        // TODO: add effects from conflict, finance, education, and tech
      ) / 365
    )

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
  // TODO: Emigration and immigration
  return gs
}

const calculateConflicts = (gs: GameState): GameState => {
  // TODO: Simulate the spread of large conflict intenationally
  return gs
}

// daily adjustment to index values
const calculateIndices = (gs: GameState): GameState => {
  // TODO: Update foodIndex, financeIndex, educationIndex, and techIndex for each CS
  // TODO: Update deltas for GS values
  return gs
}

/**
 * There are various large-scale events that can affect the entire world, e.g.
 * - natural disasters (esp. earthquakes, typhoon season),
 * - man-made disasters (global malware spread, market crash, oil tanker sinking)
 * - COVID or other large pandemics,
 * - sports events (esp. olympics),
 * - a country reaching conflict > 7, causing a happiness drop and distress worldwide
 * - introduction of online banking once a region has enough finance+tech, improving GPD and decreasing corruption
 * -
 */
const calculateEvents = (gs: GameState): GameState => {
  // TODO: Update GS news and CS happiness etc
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
 * Once images are loaded, start the game!
 */

const imageLoader = setInterval(() => {
  console.log('Loading images...')
  if (areImagesLoaded()) {
    console.log('OK!')
    clearInterval(imageLoader)
    setupCanvas()
    startGame()
  }
}, 200)
