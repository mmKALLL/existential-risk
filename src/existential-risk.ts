import {
  initialGameState,
  GameState,
  ContinentSection,
  ContinentName,
  UIButton,
  Rectangle,
  clampCSValues,
} from './types'
import {
  render,
  getContinentWithinCoordinate,
  getSelectedContinent,
  isWithinRectangle,
  getButtonRect,
} from './render'

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
    name: 'Education reform',
    description: 'Provide financial aid for having more schools and teachers.',
    additionalDescription:
      'Improves education, which over time decreases birth rate and increases finance/tech.',
    icon: images.education,
    costFunction: cs => Math.pow(cs.educationIndex, 1.5) * 100000,
    onClick: cs => {
      const educationIndex = cs.educationIndex + 0.3
      return { ...cs, educationIndex }
    },
  },
  {
    name: 'Research grant',
    description:
      'Begin a series of technological research projects in the region.',
    additionalDescription:
      'Boosts tech level based on current education level, with long-term effects in finance, health, and happiness.',
    icon: images.research,
    costFunction: cs => Math.pow(cs.techIndex, 1.5) * 100000,
    onClick: cs => {
      const techIndex = cs.techIndex + cs.educationIndex * 0.01
      const techIndexDelta = cs.techIndexDelta + cs.educationIndex * 0.01
      return { ...cs, techIndex, techIndexDelta }
    },
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
  {
    name: 'Financial boost',
    description: 'Provide money to a region as immediate financial relief.',
    additionalDescription:
      'Does little to help the economy grow, but can alleviate happiness and food stability in the short term.',
    icon: images.finance,
    costFunction: cs => (cs.GDPCapita * cs.totalPopulation) / 25000,
    onClick: cs => {
      const GDPCapita = cs.GDPCapita * 1.00001
      const happiness = cs.happiness + 0.15
      const happinessDelta = cs.happinessDelta - 0.01
      const foodIndex = cs.foodIndex + (10 - cs.foodIndex) * 0.1

      return {
        ...cs,
        GDPCapita,
        happiness,
        happinessDelta,
        foodIndex,
      }
    },
  },
  {
    name: 'Economic boost',
    description:
      'Invest money in a region to boost their economic growth permanently.',
    additionalDescription:
      'Helps the economy grow over time, providing long-term benefits to happiness, education, and food stability.',
    icon: images.economy,
    costFunction: cs => (cs.GDPCapita * cs.totalPopulation) / 2000,
    onClick: cs => {
      const GDPCapitaMultiplier = cs.GDPCapitaMultiplier + 0.01
      return { ...cs, GDPCapitaMultiplier }
    },
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
  let gs: GameState = initialGameState() // Game state
  let clickedButtons: UIButton[] = []

  const timePerFrame = 1000 / constants.FPS
  const nextDayMillis = (timeAfterAdvanceMillis: number): number =>
    constants.yearLengthMillis / 365 / gs.gameSpeed - timeAfterAdvanceMillis
  let timeUntilDayAdvance = nextDayMillis(0)

  setInterval(() => {
    // Perform button events on current state
    if (clickedButtons.length > 0) {
      const selectedContinent = getSelectedContinent(gs) as ContinentSection
      const selectedContinentIndex = gs.continentSections.indexOf(
        selectedContinent
      )
      clickedButtons.forEach(button => {
        const nextState = gs
        const nextContinent = button.onClick(selectedContinent)
        nextState.continentSections[selectedContinentIndex] = nextContinent
        return nextState
      })
      clickedButtons = []
    }

    // If gameSpeed > 0, advance state for day changes
    if (gs.gameSpeed > 0) {
      timeUntilDayAdvance -= timePerFrame
      if (timeUntilDayAdvance < 0) {
        timeUntilDayAdvance = nextDayMillis(timeUntilDayAdvance)
        gs = advanceDay(gs)
      }
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

  // On left click handle map selection and taking actions
  canvas.addEventListener('mousedown', event => {
    const bound = canvas.getBoundingClientRect()

    const x = event.clientX - bound.left - canvas.clientLeft
    const y = event.clientY - bound.top - canvas.clientTop

    // Buffer an action from UIButton
    if (y < constants.topPanelHeight || x > constants.mapWidth) {
      UIButtons.forEach((button, i) => {
        const buttonRect = getButtonRect(i)
        if (isWithinRectangle([gs.lastMouseX, gs.lastMouseY], buttonRect)) {
          clickedButtons.push(button)
        }
      })
    } else {
      // Handle map selections
      gs.selectedContinentName = getContinentWithinCoordinate(gs, [x, y])?.name
    }
  })

  // Clear continent selection on right click
  canvas.addEventListener('contextmenu', event => {
    event.preventDefault()
    gs.selectedContinentName = undefined
  })

  // Speedup the game if numeric key is pressed
  document.addEventListener('keydown', event => {
    if (!isNaN(parseInt(event.key))) {
      gs.gameSpeed = parseInt(event.key)
    }
  })
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

  const newPopulation = cs.totalPopulation + populationDelta
  const birthRate = cs.birthRate + cs.birthRateDelta / 365
  // prettier-ignore
  const birthRateDelta =
    cs.birthRateDelta
      + ((cs.happiness - 6.5) / 300 // high happiness increases birthRate over time; low reduces it. 3.5=>-0.01, 5=>-0.005, 6.5=>0, 8=>0.005, 9.5=>0.01
      // + (cs.educationIndex) // high education decreases birthRate over time
      + (0.03 * (1 - populationRatio)) // population sizes tend to try to stay similar over time. TODO: Currently linear. Ideally the following Ratio to effect: 0.6=>0.01, 0.9=>0.005, 1.1=>-0.005, 1.4=>-0.01, 1.9=>-0.015
    ) / 365 // calculate subtotal per day instead of year
  const lifeExpectancy = cs.lifeExpectancy + cs.lifeExpectancyDelta / 365
  const GDPCapita = cs.GDPCapita * (1 + cs.GDPCapitaMultiplier / 365)
  // TODO: GDPCapitaMultiplier similar to happinessDelta

  const happiness = cs.happiness + cs.happinessDelta / 365
  // prettier-ignore
  const happinessDelta =
    cs.happinessDelta
      + ((populationRatio > 0.7 ? (0.8 - populationRatio ) * 0.001 : 0.004) // overpopulation effects and main happinessDelta influence
      // TODO: add effects from conflict, finance, education, and tech
    ) / 365

  // increase conflict by 1/year when happiness = 5.5, 2/year when = 4.5, etc; higher happiness decreases conflict
  const conflictLevel = cs.conflictLevel + (6.5 - happiness) / 365
  const financeIndex = calculateFinanceIndex(GDPCapita)

  // {
  //   name: 'South America',
  //   originalPopulation: 430759766,
  //   totalPopulation: 430759766,
  //   birthRate: 15.2,
  //   birthRateDelta: -0.261,
  //   lifeExpectancy: 73.6,
  //   lifeExpectancyDelta: 0.37,
  //   GDPCapita: 8560,
  //   GDPCapitaMultiplier: 0.012,
  //   happiness: 6.163400173,
  //   happinessDelta: -0.021,
  //   foodIndex: 9.12,
  //   financeIndex: 1.79,
  //   educationIndex: 6.72,
  //   techIndex: 7.4,
  //   techIndexDelta: 0.24,
  //   diseaseIndex: 6.4,
  //   conflictLevel: 1.1,
  //   corruptionIndex: 0.505747126,
  //   globalTempDiffSensitivity: 0.7,
  //   subRegions: [],
  //   neighbors: ['Africa', 'Central America', 'Antarctica'],
  //   xywh: [350, 490, 170, 270],
  // },

  const newCS = {
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
  return clampCSValues(newCS)
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
export const clamp = (min: number, max: number, number: number): number => {
  return Math.min(max, Math.max(min, number))
}

export const sum = (array: number[]): number => {
  return array.reduce((a, b) => a + b)
}

// Explicitly check that all inferred types are used - e.g. in a switch statement
export function assertNever(x: never): never {
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
