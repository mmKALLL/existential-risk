/**
 * Type definitions
 */

export type GameState = {
  day: number
  continentSections: ContinentSection[]
}

export type ContinentName =
  | 'Africa'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'Central America'
  | 'South America'
  | 'Antarctica'
  | 'Australia'
  | 'Russia'

export type ContinentSection = {
  name: ContinentName
  totalPopulation: number
  neighbors: ContinentName[] // names of neighboring continents
  xywh: Rectangle // position of map rectangle. x-coordinate, y-coordinate, width, height
}

export type Point = [number, number] // x-coordinate, y-coordinate
export type Rectangle = [number, number, number, number] // x-coordinate, y-coordinate, width, height

export type MouseBuffer = {
  lastMouseX: number
  lastMouseY: number
  click: Point | undefined
  rightClick: Point | undefined // unused; avoid if possible
}

/**
 * Initializers for game state
 */

export const initialGameState = (): GameState => ({
  day: 0, // From 2020-01-01
  continentSections: initialContinents(),
})

// Based on 2020 data from https://www.worldometers.info/geography/7-continents/
const initialContinents = (): ContinentSection[] => [
  {
    name: 'Africa',
    totalPopulation: 1340598147,
    neighbors: ['Europe', 'Asia', 'South America', 'Antarctica'],
    xywh: [500, 400, 350, 450],
  },
  {
    name: 'Asia',
    totalPopulation: 4641054775 - 144386830, // Subtract Russia as it became its own continent
    neighbors: ['Africa', 'Australia', 'Europe', 'North America', 'Russia'],
    xywh: [900, 100, 550, 450],
  },
  {
    name: 'Europe',
    totalPopulation: 747636026,
    neighbors: ['Africa', 'Asia', 'North America', 'Russia'],
    xywh: [550, 100, 400, 350],
  },
  {
    name: 'North America',
    totalPopulation: 592072212,
    neighbors: ['Asia', 'Europe', 'Central America', 'Russia'],
    xywh: [100, 50, 400, 350],
  },
  {
    name: 'Central America',
    totalPopulation: 430759766,
    neighbors: ['North America', 'South America'],
    xywh: [300, 500, 350, 400],
  },
  {
    name: 'South America',
    totalPopulation: 430759766,
    neighbors: ['Africa', 'Central America', 'Antarctica'],
    xywh: [300, 500, 350, 400],
  },
  {
    name: 'Antarctica',
    totalPopulation: 2687,
    neighbors: ['Africa', 'South America'],
    xywh: [50, 800, 1250, 100],
  },
  {
    name: 'Australia',
    totalPopulation: 42677813,
    neighbors: ['Asia'],
    xywh: [1100, 550, 300, 150],
  },
  {
    name: 'Russia',
    totalPopulation: 144386830,
    neighbors: ['Asia', 'Europe', 'North America'],
    xywh: [1100, 550, 300, 150],
  },
]

export const initialMouseBuffer = (): MouseBuffer => ({
  lastMouseX: 0,
  lastMouseY: 0,
  click: undefined,
  rightClick: undefined,
})
