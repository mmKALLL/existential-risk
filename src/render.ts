import {
  GameState,
  ContinentName,
  ContinentSection,
  Point,
  Rectangle,
  Coordinate,
} from './types'
import { constants } from './existential-risk'

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

/**
 * Drawing functions
 */

export function render(state: GameState, images: any) {
  clearCanvas()
  drawBackground(images)
  drawContinents(state)
  drawUIComponents(state)
}

export function clearCanvas() {
  ctx.clearRect(0, 0, constants.mapWidth, 900)
}

export function drawBackground(images: any) {
  // Draw continental background
  ctx.globalAlpha = 0.65
  ctx.drawImage(images.continents2, 0, 90, 1370, 700)
  ctx.globalAlpha = 1
}

export function drawContinents(state: GameState) {
  // Set up the drawing
  ctx.beginPath()
  useContinentBorder()

  // Draw lines between neighboring continents
  state.continentSections.forEach(cs => {
    cs.neighbors.forEach(name => {
      const neighbor = getContinent(state, name)
      if (neighbor) {
        if (!isPacificConnection(cs.name, neighbor.name)) {
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
  ctx.lineTo(
    constants.mapWidth,
    continentMidCoordinate(state, 'North America', 'Asia').y
  )

  ctx.moveTo(...xywhCenter(getContinent(state, 'Russia')!.xywh))
  ctx.lineTo(
    constants.mapWidth,
    continentMidCoordinate(state, 'North America', 'Russia').y
  )

  // Finish the path and draw everything in one shot
  ctx.stroke()

  // debug: Draw the continent bounding boxes
  state.continentSections.forEach(cs => {
    ctx.strokeRect(...cs.xywh)
  })
}

export function drawUIComponents(state: GameState) {
  const strokeWidth = constants.topPanelBorderWidth
  const strokeOffset = strokeWidth / 2
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

  // Top panel
  drawTopBarComponentBorder(1600, 1600 - strokeWidth, constants.topPanelHeight)

  // Top-right status box. Starts from graph box.
  const statusBoxWidth = 350
  const statusBoxHeight = 150
  drawTopBarComponentBorder(constants.mapWidth, statusBoxWidth, statusBoxHeight)

  // Status box texts
  useText()
  drawMultilineText(
    'World stats (average):\nHappiness: 100\nConfidence: 100',
    constants.mapWidth - statusBoxWidth + 10,
    10 + strokeOffset,
    statusBoxWidth / 2 - 30
  )
  drawMultilineText(
    'World stats (median):\nHappiness: 80\nConfidence: 80',
    constants.mapWidth - statusBoxWidth / 2 + 5,
    10 + strokeOffset,
    statusBoxWidth / 2 - 30
  )

  // Selection box. Starts from far right edge
  drawTopBarComponentBorder(1600, 200, 900 - strokeWidth * 2)
  renderSelectionBoxContents(state, strokeOffset)

  // date and speed
  useText()
  drawMultilineText(
    `Current date: ${new Date(
      new Date().setFullYear(2020, 0, 1) + state.day * 3600 * 1000 * 24 // add days; one day is 3600000 * 24 milliseconds
    )
      .toISOString()
      .slice(0, 10)}` + // Get the date only
      '\n' +
      `Your budget: ${(state.globalBudget / 1000000).toFixed(1)} million USD.`,
    200,
    10 + strokeOffset,
    400
  )

  // debug
  useText()
  drawMultilineText(
    `Mouse point: (${state.lastMouseX}, ${state.lastMouseY})` +
      '\n' +
      `Mouse point: (${state.lastMouseX}, ${state.lastMouseY})`
        .split('')
        .reverse()
        .join(''),
    10 + strokeOffset,
    10 + strokeOffset,
    400
  )
}

function renderSelectionBoxContents(state: GameState, strokeOffset: number) {
  // Selection box texts
  const continent = getSelectedContinent(state)
  if (continent) {
    const selectionText = continentSelectionText(continent)
    drawMultilineText(
      selectionText,
      constants.mapWidth + 10,
      10,
      180 // 10 pixels of padding on both sides of the panel
    )
  }
}

/**
 * Drawing utils and hooks for renderingContext settings
 */

function drawMultilineText(
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number = constants.lineHeight
) {
  useText()
  ctx.beginPath()
  let i = 0
  text.split('\n').forEach(line => {
    ctx.fillText(line, x, y + lineHeight * i, maxWidth)
    i++
  })
  ctx.stroke()
}

function useText() {
  ctx.strokeStyle = '#101'
  ctx.lineWidth = 1
  ctx.textBaseline = 'top'
  ctx.font = `${constants.fontSize}px sans-serif`
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
 * General utilities
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

export const getContinentWithinCoordinate = (
  state: GameState,
  point: Point
): ContinentSection | undefined => {
  return state.continentSections.find(cs => isWithinRectangle(point, cs.xywh))
}

// Check if the connection crosses the pacific ocean. If so the connection lines need to wrap the edges instead of going straight across
const isPacificConnection = (
  name1: ContinentName,
  name2: ContinentName
): boolean => {
  return (
    (name1 === 'North America' && (name2 === 'Asia' || name2 === 'Russia')) ||
    (name2 === 'North America' && (name1 === 'Asia' || name1 === 'Russia'))
  )
}

// Show selected (clicked) continent, or currently hovered one if none is selected
const getSelectedContinent = (
  state: GameState
): ContinentSection | undefined => {
  if (state.selectedContinentName) {
    return getContinent(state, state.selectedContinentName)
  }
  return getContinentWithinCoordinate(state, [
    state.lastMouseX,
    state.lastMouseY,
  ])
}

const continentSelectionText = (cs: ContinentSection): string => {
  const { originalPopulation, xywh, subRegions, ...displayValues } = {
    ...cs,
    totalPopulation: `${Math.floor(cs.totalPopulation / 100000) / 10} million`,
  }
  return JSON.stringify(
    displayValues,
    (key, val) =>
      typeof val === 'number'
        ? val > 10
          ? val.toFixed(0)
          : val.toFixed(2)
        : val,
    1
  )
}

// Check if the point's x-y is between the rectangle's corners
const isWithinRectangle = (point: Point, rect: Rectangle) => {
  return (
    point[0] > rect[0] &&
    point[1] > rect[1] &&
    point[0] < rect[0] + rect[2] && // x + width
    point[1] < rect[1] + rect[3] // y + height
  )
}

// Used for checking if a point lies within a convex.
const isRightFromEdge = (
  point: Point,
  edgeStart: Point,
  edgeEnd: Point
): boolean => {
  // const D = (x2 - x1) * (yp - y1) - (xp - x1) * (y2 - y1)
  return true // true if and only if D < 0
}
