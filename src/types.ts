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

export type Coordinate = { x: number; y: number }
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
    xywh: [590, 380, 210, 280],
  },
  {
    name: 'Asia',
    totalPopulation: 4641054775 - 144386830, // Subtract Russia as it became its own continent
    neighbors: ['Africa', 'Australia', 'Europe', 'North America', 'Russia'],
    xywh: [800, 310, 360, 250],
  },
  {
    name: 'Europe',
    totalPopulation: 747636026,
    neighbors: ['Africa', 'Asia', 'North America', 'Russia'],
    xywh: [600, 200, 170, 180],
  },
  {
    name: 'North America',
    totalPopulation: 592072212,
    neighbors: ['Asia', 'Europe', 'Central America', 'Russia'],
    xywh: [130, 150, 380, 250],
  },
  {
    name: 'Central America',
    totalPopulation: 430759766,
    neighbors: ['North America', 'South America'],
    xywh: [200, 400, 200, 90],
  },
  {
    name: 'South America',
    totalPopulation: 430759766,
    neighbors: ['Africa', 'Central America', 'Antarctica'],
    xywh: [350, 490, 170, 270],
  },
  {
    name: 'Antarctica',
    totalPopulation: 2687,
    neighbors: ['Africa', 'South America'],
    xywh: [100, 800, 1180, 97],
  },
  {
    name: 'Australia',
    totalPopulation: 42677813,
    neighbors: ['Asia'],
    xywh: [1050, 560, 230, 150],
  },
  {
    name: 'Russia',
    totalPopulation: 144386830,
    neighbors: ['Asia', 'Europe', 'North America'],
    xywh: [770, 170, 550, 140],
  },
]

export const initialMouseBuffer = (): MouseBuffer => ({
  lastMouseX: 0,
  lastMouseY: 0,
  click: undefined,
  rightClick: undefined,
})
