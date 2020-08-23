/**
 * Type definitions
 */

export type GameState = {
  day: number
  globalBudget: number // Player's money reserves. Do a good job increasing happiness and you earn more.
  co2ppm: number // co2 parts per million in atmosphere. Values above 300 slightly hamper education. Values above 400 are harmful; outdoor air pollution is the world's 4th numerous killer with 4.9 deaths caused yearly. High values may boost crop productivity, though.
  co2ppmDelta: number // Increase in co2ppm per year. Based on extrapolating https://www.kaggle.com/ucsandiego/carbon-dioxide
  globalTempDiff: number // change in global surface temperature relative to 1951-1980 average temperatures, https://climate.nasa.gov/vital-signs/global-temperature/
  globalTempDiffDelta: number // yearly change in globalTempDiff; high temp causes unrest and decreases finances, causing emigration
  continentSections: ContinentSection[]
  selectedContinent: ContinentSection | undefined
  lastMouseX: number
  lastMouseY: number
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
  birthRate: number // births / 1000 pop / year
  birthRateDelta: number // acceleration of population growth yer year; decreases from high education or low happiness
  lifeExpectancy: number // years; this, disease, and conflict causes daily deaths. Can increase from high tech/finance
  lifeExpectancyDelta: number // acceleration of life expectancy per year; increased by tech improvements
  GDPCapita: number // GDP per capita as of 2019, in international PPP adjusted dollars
  GDPCapitaMultiplier: number // annual multiplier for GDP in percent (e.g. 0.03 for 3% increase, -0.16 for 16% decrease)

  happiness: number // float from 0 to 10; indicates optimism and generosity. Low happiness compared to neighbors causes immigration
  happinessDelta: number // Acceleration of happiness per year; influenced by conflict, finance, education, and tech

  foodIndex: number // 0 to 10, higher is better. Level of malnourishment and famine. Finance increases but mass immigration and conflict greatly decreases. High values boost education. Anything less than 5 is extremely alarming; 5-8 is serious and more than 9 normal.

  /**
   * Finance index.
   * Influences happiness and causes education index to grow/decrease. 4th degree polynomial. 8 equals a 40k PPP$ GDP/pc, anything beyond 70k is 10.
   * financeIndex = 0.0000008 x^(4.1) - 0.0000078 x^(3.5) - 0.005 x^(2.3) + 0.016 x^(2) + 0.175 x - 0.17, and 10 when x>70
   *     where x is 1/1000 of GDP per capita in international PPP adjusted dollars
   */
  financeIndex: number // 0 to 10, level of financial freedom
  educationIndex: number // 0 to 10, level of education. Influences tech and finance.
  //                        Free universal junior high corresponds to 5; upper sec. to 7, uni to 9, doctorate to 10
  techIndex: number // 0 to 100, level of tech in the region. 8 to 10 is normal for US 2000s, 10-25 normal for US 2010s, anything beyond causes unrest and AI/nuclear threat
  techIndexDelta: number // acceleration of tech index per year

  // Disease causes deaths. Decreases over time as a function of education, random events cause a jump in proportion to finance index.
  diseaseIndex: number // 0 to 100, normally around 0-5 for wealthy countries and 5-15 elsewhere. Global 10 or continental 20 is the threshold for declaring a pandemic.

  /**
   * Conflict level.
   * Immigration/emigration both cause and are caused by this. Two parties may not have the same level (usually winning belligerent has less unrest).
   * Great negative impact on happiness and foodIndex. Larger conflict causes many deaths.
   *
   * 0 is absolute peace,
   * 1 is minor unrest and occasional violence,
   * 2 is general unrest and local conflict,
   * 3 is major unrest and national conflict,
   * 4 is civil war or borderless conflict between independent groups
   * 5 is international war within a region
   * 6 is international war within
   * 7 is international war between continents or religions
   * 8 is large-scale international war, i.e. world war III
   * 9 is international nuclear war, i.e. existential threat
   */
  conflictLevel: number // float with level of conflict within the region

  globalTempDiffSensitivity: number // -5 to 5. Multiplier for happiness/finance sensitivity to climate change
  subRegions: Partial<ContinentSection[]> // unused
  neighbors: ContinentName[] // names of neighboring continents
  xywh: Rectangle // position of map rectangle. x-coordinate, y-coordinate, width, height
}

export type Coordinate = { x: number; y: number }
export type Point = [number, number] // x-coordinate, y-coordinate
export type Rectangle = [number, number, number, number] // x-coordinate, y-coordinate, width, height

// export type MouseBuffer = {
//   lastMouseX: number
//   lastMouseY: number
//   click: Point | undefined
//   rightClick: Point | undefined // unused; avoid if possible
// }

/**
 * Initializers for game state
 */

// Sources for game state values in type definition.
export const initialGameState = (): GameState => ({
  day: 0, // From 2020-01-01
  globalBudget: Math.pow(10, 8), // start with 100M
  co2ppm: 415.5,
  co2ppmDelta: 2.85,
  globalTempDiff: 0.99,
  globalTempDiffDelta: 0.039,
  continentSections: initialContinents(),
  selectedContinent: undefined,
  lastMouseX: 0,
  lastMouseY: 0,
})

// Population counts based on 2020 data from: https://www.worldometers.info/geography/7-continents/
// Population growth and delta based on https://ourworldindata.org/grapher/birth-rate-vs-death-rate?stackMode=absolute&time=2006..latest
// Happiness based on World Happiness Report: https://www.kaggle.com/londeen/world-happiness-report-2020, growth on historical data from https://www.kaggle.com/unsdsn/world-happiness
// Life expectancy based on Our World in Data report: https://ourworldindata.org/life-expectancy
// GDP is based on International Monetary Fund's data: https://www.imf.org/external/datamapper/NGDP_RPCH@WEO/OEMDC/ADVEC/WEOWORLD
// Food index is based on the inverse of Global Hunger Index, from: https://ourworldindata.org/hunger-and-undernourishment
// Finance index is based on GDP, compiled from data on Our World in Data and IMF.
// globalTempDiffSensitivity based on estimations from World Climate Map: https://www.mapsofworld.com/world-maps/world-climate-map.html
// Conflict level based on guesstimations and news
const initialContinents = (): ContinentSection[] => [
  {
    name: 'Africa',
    totalPopulation: 1340598147,
    birthRate: 35.91,
    birthRateDelta: -0.41,
    lifeExpectancy: 63.2,
    lifeExpectancyDelta: 0.46,
    GDPCapita: 1930,
    GDPCapitaMultiplier: 0.036,
    happiness: 4.571100235,
    happinessDelta: 0.0304200469,
    foodIndex: 7.1,
    financeIndex: 0.2,
    educationIndex: 0,
    techIndex: 0,
    techIndexDelta: 0,
    diseaseIndex: 0,
    conflictLevel: 0,
    globalTempDiffSensitivity: 3.6,
    subRegions: [],
    neighbors: ['Europe', 'Asia', 'South America', 'Antarctica'],
    xywh: [590, 380, 210, 280],
  },
  {
    name: 'Asia',
    totalPopulation: 4641054775 - 144386830, // Subtract Russia as it became its own continent
    birthRate: 21.2,
    birthRateDelta: -0.386,
    lifeExpectancy: 73.6,
    lifeExpectancyDelta: 0.27,
    GDPCapita: 7350,
    GDPCapitaMultiplier: 0.061,
    happiness: 5.384300232, // Median from 2020. 2015 data medians: Southeast: 5.353499889, South: 4.75415659, East: 5.789672375
    happinessDelta: 0.017038122,
    foodIndex: 8.4,
    financeIndex: 1.5,
    educationIndex: 0,
    techIndex: 0,
    techIndexDelta: 0,
    diseaseIndex: 0,
    conflictLevel: 0,
    globalTempDiffSensitivity: 2.4,
    subRegions: [],
    neighbors: ['Africa', 'Australia', 'Europe', 'North America', 'Russia'],
    xywh: [800, 315, 360, 245],
  },
  {
    name: 'Europe',
    totalPopulation: 747636026,
    birthRate: 9.9,
    birthRateDelta: -0.152,
    lifeExpectancy: 78.6,
    lifeExpectancyDelta: 0.23,
    GDPCapita: 29410,
    GDPCapitaMultiplier: 0.027,
    happiness: 6.5845398902, // Average from 2020 medians: Northern: 7.504499912, Central: 6.215499878, Eastern: 5.949999809, Southern: 6.15899992, Western: 7.093699932,
    happinessDelta: 0.076499975,
    foodIndex: 9.7,
    financeIndex: 6.7,
    educationIndex: 0,
    techIndex: 0,
    techIndexDelta: 0,
    diseaseIndex: 0,
    conflictLevel: 0,
    globalTempDiffSensitivity: 1.2,
    subRegions: [],
    neighbors: ['Africa', 'Asia', 'North America', 'Russia'],
    xywh: [600, 200, 170, 180],
  },
  {
    name: 'North America',
    totalPopulation: 592072212,
    birthRate: 12.8,
    birthRateDelta: -0.24,
    lifeExpectancy: 79.2,
    lifeExpectancyDelta: 0.03,
    GDPCapita: 49240,
    GDPCapitaMultiplier: 0.024,
    happiness: 7.0858500005,
    happinessDelta: -0.0376,
    foodIndex: 9.52,
    financeIndex: 8.0,
    educationIndex: 0,
    techIndex: 0,
    techIndexDelta: 0,
    diseaseIndex: 0,
    conflictLevel: 0,
    globalTempDiffSensitivity: -0.4,
    subRegions: [],
    neighbors: ['Asia', 'Europe', 'Central America', 'Russia'],
    xywh: [130, 150, 380, 250],
  },
  {
    name: 'Central America',
    totalPopulation: 430759766,
    birthRate: 20.97,
    birthRateDelta: -0.32,
    lifeExpectancy: 75.1,
    lifeExpectancyDelta: -0.02,
    GDPCapita: 21363,
    GDPCapitaMultiplier: 0.027,
    happiness: 6.304800034,
    happinessDelta: -0.053,
    foodIndex: 90.6,
    financeIndex: 5.3,
    educationIndex: 0,
    techIndex: 0,
    techIndexDelta: 0,
    diseaseIndex: 0,
    conflictLevel: 0,
    globalTempDiffSensitivity: 1.8,
    subRegions: [],
    neighbors: ['North America', 'South America'],
    xywh: [200, 400, 200, 90],
  },
  {
    name: 'South America',
    totalPopulation: 430759766,
    birthRate: 15.2,
    birthRateDelta: -0.261,
    lifeExpectancy: 73.6,
    lifeExpectancyDelta: 0.37,
    GDPCapita: 8560,
    GDPCapitaMultiplier: 0.012,
    happiness: 6.163400173,
    happinessDelta: -0.021,
    foodIndex: 91.2,
    financeIndex: 1.79,
    educationIndex: 0,
    techIndex: 0,
    techIndexDelta: 0,
    diseaseIndex: 0,
    conflictLevel: 0,
    globalTempDiffSensitivity: 0.7,
    subRegions: [],
    neighbors: ['Africa', 'Central America', 'Antarctica'],
    xywh: [350, 490, 170, 270],
  },
  {
    name: 'Antarctica',
    totalPopulation: 2687,
    birthRate: 2.3,
    birthRateDelta: -0.18,
    lifeExpectancy: 71.7,
    lifeExpectancyDelta: 0.13,
    GDPCapita: 32000,
    GDPCapitaMultiplier: 0.01,
    happiness: 6.528499889,
    happinessDelta: -0.088,
    foodIndex: 91.0,
    financeIndex: 7.1,
    educationIndex: 0,
    techIndex: 0,
    techIndexDelta: 0,
    diseaseIndex: 0,
    conflictLevel: 0,
    globalTempDiffSensitivity: -1.6,
    subRegions: [],
    neighbors: ['Africa', 'South America'],
    xywh: [100, 800, 1180, 97],
  },
  {
    name: 'Australia',
    totalPopulation: 42677813,
    birthRate: 14.5,
    birthRateDelta: -0.24,
    lifeExpectancy: 83.4,
    lifeExpectancyDelta: 0.15,
    GDPCapita: 53220,
    GDPCapitaMultiplier: 0.027,
    happiness: 7.25210001,
    happinessDelta: -0.006,
    foodIndex: 8.4, // Rough estimate; PNG has GHI 29.7 (very serious), others 5-10. Took average and subtracted from 100, then divided by 10.
    financeIndex: 8.77,
    educationIndex: 0,
    techIndex: 0,
    techIndexDelta: 0,
    diseaseIndex: 0,
    conflictLevel: 0,
    globalTempDiffSensitivity: 1.1,
    subRegions: [],
    neighbors: ['Asia'],
    xywh: [1050, 560, 230, 150],
  },
  {
    name: 'Russia',
    totalPopulation: 144386830,
    birthRate: 12.9,
    birthRateDelta: 0.16,
    lifeExpectancy: 71.5,
    lifeExpectancyDelta: 0.28,
    GDPCapita: 30820,
    GDPCapitaMultiplier: 0.025,
    happiness: 5.546000004,
    happinessDelta: -0.034,
    foodIndex: 93.9,
    financeIndex: 6.4,
    educationIndex: 0,
    techIndex: 0,
    techIndexDelta: 0,
    diseaseIndex: 0,
    conflictLevel: 0,
    globalTempDiffSensitivity: -4.4,
    subRegions: [],
    neighbors: ['Asia', 'Europe', 'North America'],
    xywh: [770, 170, 550, 145],
  },
]

const continentBase: ContinentSection = {
  name: 'Europe',
  totalPopulation: 0,
  birthRate: 0,
  birthRateDelta: 0,
  lifeExpectancy: 0,
  lifeExpectancyDelta: 0,
  GDPCapita: 0,
  GDPCapitaMultiplier: 0,
  happiness: 0,
  happinessDelta: 0,
  foodIndex: 0,
  financeIndex: 0,
  educationIndex: 0,
  techIndex: 0,
  techIndexDelta: 0,
  diseaseIndex: 0,
  conflictLevel: 0,
  globalTempDiffSensitivity: 0,
  subRegions: [],
  neighbors: [],
  xywh: [0, 0, 200, 200],
}

// export const initialContinentAverages: ContinentSection = initialContinents().reduce(
//   (acc, cur) => ({

//   }), continentBase
// )
