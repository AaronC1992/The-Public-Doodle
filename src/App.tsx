import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabaseClient'

type FactionId = 'pond'
type PondId = FactionId
type DuckState = 'idle' | 'swim' | 'forage' | 'rest' | 'socialize'
type WorldId = 'duck' | 'stickman' | 'animal' | 'random'

type Point = {
  x: number
  y: number
}

type Stroke = {
  points: Point[]
  color: string
  size: number
  fill?: string
  closed?: boolean
}

type ToolMode = 'pencil' | 'fill'

function isPoint(value: unknown): value is Point {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { x?: unknown; y?: unknown }
  return typeof candidate.x === 'number' && typeof candidate.y === 'number'
}

function normalizeStroke(value: unknown): Stroke | null {
  if (!value) return null

  // Legacy format: Stroke was Point[]
  if (Array.isArray(value)) {
    const points = value.filter(isPoint)
    if (points.length === 0) return null
    return {
      points,
      color: '#15323f',
      size: 4,
    }
  }

  if (typeof value !== 'object') return null
  const candidate = value as {
    points?: unknown
    color?: unknown
    size?: unknown
    fill?: unknown
    closed?: unknown
  }

  const rawPoints = Array.isArray(candidate.points) ? candidate.points : []
  const points = rawPoints.filter(isPoint)
  if (points.length === 0) return null

  const color = typeof candidate.color === 'string' ? candidate.color : '#15323f'
  const size = typeof candidate.size === 'number' ? candidate.size : 4
  const fill = typeof candidate.fill === 'string' ? candidate.fill : undefined
  const closed = typeof candidate.closed === 'boolean' ? candidate.closed : undefined

  return {
    points,
    color,
    size,
    fill,
    closed,
  }
}

function normalizeArt(value: unknown): Stroke[] {
  if (!Array.isArray(value)) return []
  return value.map(normalizeStroke).filter((stroke): stroke is Stroke => Boolean(stroke))
}

function circlePoints(cx: number, cy: number, radius: number, steps = 36): Point[] {
  const points: Point[] = []
  for (let i = 0; i < steps; i += 1) {
    const theta = (Math.PI * 2 * i) / steps
    points.push({
      x: cx + Math.cos(theta) * radius,
      y: cy + Math.sin(theta) * radius,
    })
  }
  return points
}

function ellipsePoints(cx: number, cy: number, radiusX: number, radiusY: number, steps = 36): Point[] {
  const points: Point[] = []
  for (let i = 0; i < steps; i += 1) {
    const theta = (Math.PI * 2 * i) / steps
    points.push({
      x: cx + Math.cos(theta) * radiusX,
      y: cy + Math.sin(theta) * radiusY,
    })
  }
  return points
}

const STARTER_DUCK_ART: Stroke[] = [
  {
    color: '#f0c941',
    fill: '#ffdd5e',
    closed: true,
    size: 1.4,
    points: ellipsePoints(50, 62, 30, 24, 56),
  },
  {
    color: '#f0c941',
    fill: '#ffdd5e',
    closed: true,
    size: 1.4,
    points: circlePoints(50, 30, 16, 48),
  },
  {
    color: '#111111',
    fill: '#111111',
    closed: true,
    size: 1,
    points: circlePoints(56, 29, 2.4, 24),
  },
  {
    color: '#111111',
    fill: '#111111',
    closed: true,
    size: 1,
    points: [
      { x: 64, y: 33 },
      { x: 78, y: 36 },
      { x: 64, y: 39 },
    ],
  },
]

const STARTER_STICKMAN_ART: Stroke[] = [
  {
    color: '#1f2f3a',
    fill: '#f2d0ab',
    closed: true,
    size: 1.2,
    points: circlePoints(50, 20, 9, 40),
  },
  {
    color: '#1f2f3a',
    size: 4,
    points: [
      { x: 50, y: 30 },
      { x: 50, y: 62 },
    ],
  },
  {
    color: '#1f2f3a',
    size: 4,
    points: [
      { x: 34, y: 44 },
      { x: 66, y: 44 },
    ],
  },
  {
    color: '#1f2f3a',
    size: 4,
    points: [
      { x: 50, y: 62 },
      { x: 36, y: 86 },
    ],
  },
  {
    color: '#1f2f3a',
    size: 4,
    points: [
      { x: 50, y: 62 },
      { x: 64, y: 86 },
    ],
  },
]

const STARTER_ANIMAL_ART: Stroke[] = [
  {
    color: '#6b4b2f',
    fill: '#b78453',
    closed: true,
    size: 1.4,
    points: ellipsePoints(50, 58, 30, 22, 52),
  },
  {
    color: '#6b4b2f',
    fill: '#c69360',
    closed: true,
    size: 1.4,
    points: circlePoints(50, 33, 15, 44),
  },
  {
    color: '#6b4b2f',
    fill: '#b78453',
    closed: true,
    size: 1.2,
    points: [
      { x: 39, y: 21 },
      { x: 33, y: 11 },
      { x: 43, y: 16 },
    ],
  },
  {
    color: '#6b4b2f',
    fill: '#b78453',
    closed: true,
    size: 1.2,
    points: [
      { x: 61, y: 21 },
      { x: 67, y: 11 },
      { x: 57, y: 16 },
    ],
  },
  {
    color: '#1d1d1d',
    fill: '#1d1d1d',
    closed: true,
    size: 1,
    points: circlePoints(44, 33, 2, 18),
  },
  {
    color: '#1d1d1d',
    fill: '#1d1d1d',
    closed: true,
    size: 1,
    points: circlePoints(56, 33, 2, 18),
  },
  {
    color: '#4d2f1f',
    fill: '#4d2f1f',
    closed: true,
    size: 1,
    points: [
      { x: 50, y: 37 },
      { x: 54, y: 42 },
      { x: 46, y: 42 },
    ],
  },
]

function renderStroke(stroke: Stroke, key: string, widthScale = 1) {
  const points = stroke.points.map((point) => `${point.x},${point.y}`).join(' ')
  const strokeWidth = Math.max(1, stroke.size * widthScale)

  if (stroke.closed || stroke.fill) {
    return (
      <polygon
        key={key}
        points={points}
        fill={stroke.fill ?? 'none'}
        stroke={stroke.color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }

  return (
    <polyline
      key={key}
      points={points}
      fill="none"
      stroke={stroke.color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

function rainbowColorFromHue(hue: number) {
  return `hsl(${Math.floor(hue) % 360} 90% 55%)`
}

type Duck = {
  id: string
  name: string
  createdAt: number
  factionId: FactionId
  mood: number
  energy: number
  hunger: number
  social: number
  speed: number
  state: DuckState
  x: number
  y: number
  facing: 'left' | 'right'
  clickCount: number
  art: Stroke[]
  animationFrames: Stroke[][]
  animationFps: number
  pondId: PondId
}

type PondViewMode = 'popular' | 'newest' | 'random'

type TimelineEvent = {
  id: string
  duckId: string
  summary: string
  createdAt: number
  pondId: PondId
}

type Faction = {
  id: FactionId
  name: string
  color: string
}

type WorldConfig = {
  id: WorldId
  title: string
  pondName: string
  residentSingular: string
  residentPlural: string
  drawLabel: string
  galleryLabel: string
  accentColor: string
}

const SINGLE_POND: Faction = { id: 'pond', name: 'Sunny Pond', color: '#78bfd8' }

const WORLD_IDS: WorldId[] = ['duck', 'stickman', 'animal', 'random']

const WORLD_CONFIGS: Record<WorldId, WorldConfig> = {
  duck: {
    id: 'duck',
    title: 'Duck World',
    pondName: 'Sunny Pond',
    residentSingular: 'Duck',
    residentPlural: 'Ducks',
    drawLabel: 'Draw a Duck',
    galleryLabel: 'Duck Gallery',
    accentColor: '#78bfd8',
  },
  stickman: {
    id: 'stickman',
    title: 'Stickman World',
    pondName: 'Sketch Field',
    residentSingular: 'Stickman',
    residentPlural: 'Stickmen',
    drawLabel: 'Draw a Stickman',
    galleryLabel: 'Stickman Gallery',
    accentColor: '#8fc3ea',
  },
  animal: {
    id: 'animal',
    title: 'Animal World',
    pondName: 'Wild Meadow',
    residentSingular: 'Animal',
    residentPlural: 'Animals',
    drawLabel: 'Draw an Animal',
    galleryLabel: 'Animal Gallery',
    accentColor: '#8bd8bf',
  },
  random: {
    id: 'random',
    title: 'Random World',
    pondName: 'Mystery Basin',
    residentSingular: 'Creature',
    residentPlural: 'Creatures',
    drawLabel: 'Draw Anything',
    galleryLabel: 'Random Gallery',
    accentColor: '#d6b47f',
  },
}

const NAME_BANK = [
  'Milo',
  'Saffy',
  'Pebble',
  'Rolo',
  'Juniper',
  'Maple',
  'Clover',
  'Tango',
  'Puddle',
  'Aster',
  'Mango',
  'Luna',
  'Quincy',
  'Biscuit',
  'Nova',
  'Coral',
  'Sunny',
  'Drift',
  'River',
  'Pico',
]

const STORAGE_KEY = 'duck-pond-v2-state'
const MAX_DUCKS = 220
const MAX_ANIMATION_FRAMES = 5
const DEFAULT_ANIMATION_FPS = 6
const DRAW_MIN = 0
const DRAW_MAX = 100

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function pickOne<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

function randomId() {
  return Math.random().toString(36).slice(2, 11)
}

function cloneArt(strokes: Stroke[]) {
  return strokes.map((stroke) => ({
    color: stroke.color,
    size: stroke.size,
    fill: stroke.fill,
    closed: stroke.closed,
    points: stroke.points.map((point) => ({ ...point })),
  }))
}

function factionMoodDelta(duck: Duck) {
  return duck.pondId === duck.factionId ? 4 : 4
}

function getStateWeights(duck: Duck, nearCount: number): Record<DuckState, number> {
  return {
    idle: 10,
    swim: 20 + (duck.energy > 60 ? 8 : 0),
    forage: 12 + (duck.hunger < 45 ? 24 : 0),
    rest: 8 + (duck.energy < 42 ? 30 : 0),
    socialize: 10 + nearCount * 8 + (duck.social < 45 ? 12 : 0),
  }
}

function weightedState(weights: Record<DuckState, number>): DuckState {
  const entries = Object.entries(weights) as [DuckState, number][]
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  const roll = Math.random() * total
  let sum = 0
  for (const [state, weight] of entries) {
    sum += weight
    if (roll <= sum) {
      return state
    }
  }
  return 'idle'
}

function createDuck(input?: Partial<Duck>): Duck {
  const factionId = SINGLE_POND.id
  const normalizedArt = normalizeArt(input?.art)
  const normalizedFrames = Array.isArray(input?.animationFrames)
    ? input.animationFrames
        .map((frame) => normalizeArt(frame))
        .filter((frame) => frame.length > 0)
    : []
  const animationFrames =
    normalizedFrames.length > 0 ? normalizedFrames : normalizedArt.length > 0 ? [normalizedArt] : []
  const art = normalizedArt.length > 0 ? normalizedArt : animationFrames[0] ?? []

  return {
    id: input?.id ?? randomId(),
    name: input?.name ?? `${pickOne(NAME_BANK)} ${Math.floor(Math.random() * 90 + 10)}`,
    createdAt: input?.createdAt ?? Date.now(),
    factionId,
    mood: input?.mood ?? Math.floor(Math.random() * 30 + 55),
    energy: input?.energy ?? Math.floor(Math.random() * 30 + 55),
    hunger: input?.hunger ?? Math.floor(Math.random() * 30 + 55),
    social: input?.social ?? Math.floor(Math.random() * 30 + 55),
    speed: input?.speed ?? Number((Math.random() * 1.2 + 0.8).toFixed(2)),
    state: input?.state ?? 'idle',
    x: input?.x ?? Math.random() * 100,
    y: input?.y ?? Math.random() * 100,
    facing: input?.facing ?? 'right',
    clickCount: input?.clickCount ?? 0,
    art,
    animationFrames,
    animationFps: clamp(input?.animationFps ?? DEFAULT_ANIMATION_FPS, 1, 12),
    pondId: SINGLE_POND.id,
  }
}

type PersistedState = {
  ducks: Duck[]
  timeline: TimelineEvent[]
  selectedDuckId: string | null
  tickCount: number
}

type PersistedStore = {
  selectedWorldId: WorldId
  worlds: Record<WorldId, PersistedState>
}

type ScreenMode = 'home' | 'pond' | 'gallery' | 'draw'

function createEmptyWorldState(): PersistedState {
  return {
    ducks: [],
    timeline: [],
    selectedDuckId: null,
    tickCount: 0,
  }
}

function normalizeWorldState(rawState: unknown): PersistedState {
  if (!rawState || typeof rawState !== 'object') {
    return createEmptyWorldState()
  }

  const candidate = rawState as {
    ducks?: unknown
    timeline?: unknown
    selectedDuckId?: unknown
    tickCount?: unknown
  }

  const ducks = Array.isArray(candidate.ducks)
    ? candidate.ducks
        .map((duck) => createDuck(duck as Partial<Duck>))
        .filter((duck) => duck.art.length > 0)
    : []

  const timeline = Array.isArray(candidate.timeline)
    ? candidate.timeline.slice(0, 100).map((event) => {
        const typedEvent = event as Partial<TimelineEvent>
        if (!typedEvent || typeof typedEvent !== 'object') {
          return {
            id: randomId(),
            duckId: '',
            summary: '',
            createdAt: Date.now(),
            pondId: SINGLE_POND.id,
          }
        }

        const sourceDuck = ducks.find((duck) => duck.id === typedEvent.duckId)
        return {
          id: typeof typedEvent.id === 'string' ? typedEvent.id : randomId(),
          duckId: typeof typedEvent.duckId === 'string' ? typedEvent.duckId : '',
          summary: typeof typedEvent.summary === 'string' ? typedEvent.summary : '',
          createdAt: typeof typedEvent.createdAt === 'number' ? typedEvent.createdAt : Date.now(),
          pondId: (typedEvent.pondId ?? sourceDuck?.pondId ?? sourceDuck?.factionId ?? SINGLE_POND.id) as PondId,
        }
      })
    : []

  const selectedDuckId = typeof candidate.selectedDuckId === 'string' ? candidate.selectedDuckId : null
  const tickCount = typeof candidate.tickCount === 'number' ? candidate.tickCount : 0

  return {
    ducks,
    timeline: timeline.filter((entry) => entry.duckId.length > 0 && entry.summary.length > 0),
    selectedDuckId,
    tickCount,
  }
}

function readPersistedStore(): PersistedStore {
  const emptyWorlds: Record<WorldId, PersistedState> = {
    duck: createEmptyWorldState(),
    stickman: createEmptyWorldState(),
    animal: createEmptyWorldState(),
    random: createEmptyWorldState(),
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        selectedWorldId: 'duck',
        worlds: emptyWorlds,
      }
    }

    const parsed = JSON.parse(raw) as
      | (Partial<PersistedStore> & Partial<PersistedState>)
      | Partial<PersistedState>

    if (parsed && typeof parsed === 'object' && 'worlds' in parsed && parsed.worlds) {
      const worldsInput = parsed.worlds as Partial<Record<WorldId, unknown>>
      const selectedWorldId = WORLD_IDS.includes(parsed.selectedWorldId as WorldId)
        ? (parsed.selectedWorldId as WorldId)
        : 'duck'

      return {
        selectedWorldId,
        worlds: {
          duck: normalizeWorldState(worldsInput.duck),
          stickman: normalizeWorldState(worldsInput.stickman),
          animal: normalizeWorldState(worldsInput.animal),
          random: normalizeWorldState(worldsInput.random),
        },
      }
    }

    return {
      selectedWorldId: 'duck',
      worlds: {
        ...emptyWorlds,
        duck: normalizeWorldState(parsed),
      },
    }
  } catch {
    return {
      selectedWorldId: 'duck',
      worlds: emptyWorlds,
    }
  }
}

function getStarterArtForWorld(worldId: WorldId): Stroke[] {
  if (worldId === 'duck') return cloneArt(STARTER_DUCK_ART)
  if (worldId === 'stickman') return cloneArt(STARTER_STICKMAN_ART)
  if (worldId === 'animal') return cloneArt(STARTER_ANIMAL_ART)
  return []
}

function mergeDuckList(current: Duck[], incoming: Duck[]) {
  const map = new Map(current.map((duck) => [duck.id, duck]))

  for (const next of incoming) {
    const existing = map.get(next.id)
    if (!existing) {
      map.set(next.id, next)
      continue
    }
    map.set(next.id, {
      ...existing,
      ...next,
      clickCount: Math.max(existing.clickCount, next.clickCount),
      art: next.art.length > 0 ? next.art : existing.art,
      animationFrames: next.animationFrames.length > 0 ? next.animationFrames : existing.animationFrames,
    })
  }

  return [...map.values()].sort((a, b) => b.createdAt - a.createdAt)
}

const INITIAL_PERSISTED_STORE = readPersistedStore()

// Anonymous user key persisted in localStorage so one user gets one like per drawing
function getOrCreateUserKey(): string {
  const stored = localStorage.getItem('tpd-user-key')
  if (stored) return stored
  const key = randomId() + randomId()
  localStorage.setItem('tpd-user-key', key)
  return key
}

const USER_KEY = getOrCreateUserKey()

type DrawingRow = {
  id: string
  world_id: WorldId
  name: string
  art: unknown
  animation_frames: unknown
  animation_fps: number
  likes_count: number
  created_at: string
}

function rowToDuck(row: DrawingRow): Duck {
  return createDuck({
    id: row.id,
    name: row.name,
    createdAt: new Date(row.created_at).getTime(),
    art: normalizeArt(row.art),
    animationFrames: Array.isArray(row.animation_frames)
      ? (row.animation_frames as unknown[]).map((frame) => normalizeArt(frame)).filter((f) => f.length > 0)
      : [],
    animationFps: row.animation_fps,
    clickCount: row.likes_count,
  })
}

function App() {
  const [worldStates, setWorldStates] = useState<Record<WorldId, PersistedState>>(
    () => INITIAL_PERSISTED_STORE.worlds,
  )
  const [selectedWorldId, setSelectedWorldId] = useState<WorldId>(
    () => INITIAL_PERSISTED_STORE.selectedWorldId,
  )

  const currentWorldState = worldStates[selectedWorldId]
  const ducks = currentWorldState.ducks
  const selectedDuckId = currentWorldState.selectedDuckId
  const [serverConnected, setServerConnected] = useState(false)

  const [newName, setNewName] = useState('')
  const [screen, setScreen] = useState<ScreenMode>('home')
  const [galleryViewMode, setGalleryViewMode] = useState<PondViewMode>('newest')
  const [pondViewMode, setPondViewMode] = useState<PondViewMode>('popular')
  const [maxDucksInView, setMaxDucksInView] = useState(48)
  const [duckSizePx, setDuckSizePx] = useState(56)
  const [randomSeed, setRandomSeed] = useState(() => Math.random())
  const [galleryRandomSeed, setGalleryRandomSeed] = useState(() => Math.random())
  const [draftFrames, setDraftFrames] = useState<Stroke[][]>(() => [getStarterArtForWorld(selectedWorldId)])
  const [activeFrameIndex, setActiveFrameIndex] = useState(0)
  const [draftAnimationFps, setDraftAnimationFps] = useState(DEFAULT_ANIMATION_FPS)
  const [previewPlaying, setPreviewPlaying] = useState(false)
  const [previewClock, setPreviewClock] = useState(0)
  const [pondAnimationClock, setPondAnimationClock] = useState(0)
  const [redoArt, setRedoArt] = useState<Stroke[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawError, setDrawError] = useState('')
  const [tool, setTool] = useState<ToolMode>('pencil')
  const [brushColor, setBrushColor] = useState('#15323f')
  const [brushSize, setBrushSize] = useState(5)
  const [rainbowPencil, setRainbowPencil] = useState(false)
  const [onionSkinEnabled, setOnionSkinEnabled] = useState(true)
  const drawSurfaceRef = useRef<SVGSVGElement | null>(null)
  const activePointerIdRef = useRef<number | null>(null)
  const rainbowHueRef = useRef<number>(Math.random() * 360)
  const rainbowLastPointRef = useRef<Point | null>(null)

  const updateCurrentWorldState = (updater: (state: PersistedState) => PersistedState) => {
    setWorldStates((current) => ({
      ...current,
      [selectedWorldId]: updater(current[selectedWorldId]),
    }))
  }

  const setDucks = (next: React.SetStateAction<Duck[]>) => {
    updateCurrentWorldState((state) => ({
      ...state,
      ducks: typeof next === 'function' ? (next as (value: Duck[]) => Duck[])(state.ducks) : next,
    }))
  }

  const setTimeline = (next: React.SetStateAction<TimelineEvent[]>) => {
    updateCurrentWorldState((state) => ({
      ...state,
      timeline:
        typeof next === 'function'
          ? (next as (value: TimelineEvent[]) => TimelineEvent[])(state.timeline)
          : next,
    }))
  }

  const setSelectedDuckId = (next: React.SetStateAction<string | null>) => {
    updateCurrentWorldState((state) => ({
      ...state,
      selectedDuckId:
        typeof next === 'function'
          ? (next as (value: string | null) => string | null)(state.selectedDuckId)
          : next,
    }))
  }

  const setTickCount = (next: React.SetStateAction<number>) => {
    updateCurrentWorldState((state) => ({
      ...state,
      tickCount:
        typeof next === 'function' ? (next as (value: number) => number)(state.tickCount) : next,
    }))
  }

  const draftArt = draftFrames[activeFrameIndex] ?? []

  const setActiveFrameArt = (updater: (current: Stroke[]) => Stroke[]) => {
    setDraftFrames((current) =>
      current.map((frame, index) => {
        if (index !== activeFrameIndex) return frame
        return updater(frame)
      }),
    )
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTickCount((value) => value + 1)
      setDucks((currentDucks) => {
        const now = Date.now()
        const updates: TimelineEvent[] = []
        const next = currentDucks.map((duck) => ({ ...duck }))

        for (let i = 0; i < next.length; i += 1) {
          const duck = next[i]

          const nearby = next.filter(
            (other, idx) =>
              idx !== i && Math.abs(other.x - duck.x) < 12 && Math.abs(other.y - duck.y) < 12,
          )

          const weights = getStateWeights(duck, nearby.length)
          const nextState = weightedState(weights)
          duck.state = nextState

          const directionX = (Math.random() - 0.5) * (3 + duck.speed)
          const directionY = (Math.random() - 0.5) * (3 + duck.speed)
          duck.x = clamp(duck.x + directionX, 2, 98)
          duck.y = clamp(duck.y + directionY, 2, 98)
          if (Math.abs(directionX) > 0.05) {
            duck.facing = directionX < 0 ? 'left' : 'right'
          }

          duck.mood = clamp(duck.mood + factionMoodDelta(duck) * 0.07, 0, 100)
          duck.hunger = clamp(duck.hunger - 0.4, 0, 100)
          duck.energy = clamp(duck.energy - 0.25, 0, 100)
          duck.social = clamp(duck.social - 0.18, 0, 100)

          if (nextState === 'forage') {
            duck.hunger = clamp(duck.hunger + 10, 0, 100)
            duck.energy = clamp(duck.energy - 2, 0, 100)
          }
          if (nextState === 'rest') {
            duck.energy = clamp(duck.energy + 12, 0, 100)
            duck.mood = clamp(duck.mood + 4, 0, 100)
          }
          if (nextState === 'socialize') {
            duck.social = clamp(duck.social + 11, 0, 100)
            duck.mood = clamp(duck.mood + 5, 0, 100)
          }
          if (nextState === 'swim') {
            duck.energy = clamp(duck.energy - 1, 0, 100)
            duck.mood = clamp(duck.mood + 2, 0, 100)
          }
          if (nextState === 'idle') {
            duck.energy = clamp(duck.energy + 2, 0, 100)
          }

          if (nearby.length > 0 && Math.random() < 0.1) {
            const partner = pickOne(nearby)
            updates.unshift({
              id: randomId(),
              duckId: duck.id,
              summary: `${duck.name} shared a splash chat with ${partner.name}`,
              createdAt: now,
              pondId: duck.pondId,
            })
          }

          if (Math.random() < 0.04) {
            const action =
              nextState === 'forage'
                ? 'found a perfect crumb trail'
                : nextState === 'rest'
                  ? 'claimed a sunny lily nap spot'
                  : nextState === 'socialize'
                    ? 'hosted a tiny duck parade'
                    : nextState === 'swim'
                      ? 'cut a clean arc through the water'
                      : 'watched ripples and planned the next move'

            updates.unshift({
              id: randomId(),
              duckId: duck.id,
              summary: `${duck.name} ${action}`,
              createdAt: now,
              pondId: duck.pondId,
            })
          }

        }

        if (updates.length > 0) {
          setTimeline((currentTimeline) => [...updates, ...currentTimeline].slice(0, 120))
        }

        return next
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPondAnimationClock((value) => value + 1)
    }, 120)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!previewPlaying) return

    const timer = window.setInterval(() => {
      setPreviewClock((value) => value + 1)
    }, 100)

    return () => window.clearInterval(timer)
  }, [previewPlaying])

  useEffect(() => {
    const snapshot: PersistedStore = {
      selectedWorldId,
      worlds: worldStates,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  }, [selectedWorldId, worldStates])

  useEffect(() => {
    setDraftFrames([getStarterArtForWorld(selectedWorldId)])
    setActiveFrameIndex(0)
    setDraftAnimationFps(DEFAULT_ANIMATION_FPS)
    setPreviewPlaying(false)
    setPreviewClock(0)
    setRedoArt([])
    setDrawError('')
    setNewName('')
  }, [selectedWorldId])

  const activeWorld = WORLD_CONFIGS[selectedWorldId]

  const activePond: Faction = {
    id: SINGLE_POND.id,
    name: activeWorld.pondName,
    color: activeWorld.accentColor,
  }

  const pondThemeClass =
    selectedWorldId === 'stickman'
      ? 'pond-stickman'
      : selectedWorldId === 'animal'
        ? 'pond-animal'
        : selectedWorldId === 'random'
          ? 'pond-random'
          : 'pond-single'

  const pondDucks = ducks

  const chooseWorld = (worldId: WorldId) => {
    setSelectedWorldId(worldId)
    setScreen('pond')
  }

  const visiblePondDucks = useMemo(() => {
    const withPopularity = pondDucks.map((duck) => ({ duck, popularity: duck.clickCount }))

    if (pondViewMode === 'newest') {
      return withPopularity
        .sort((a, b) => b.duck.createdAt - a.duck.createdAt)
        .slice(0, maxDucksInView)
        .map((entry) => entry.duck)
    }

    if (pondViewMode === 'random') {
      const scored = withPopularity
        .map((entry) => ({
          ...entry,
          score: Math.sin(entry.duck.createdAt * 0.001 + randomSeed * 1000 + entry.duck.id.length),
        }))
        .sort((a, b) => b.score - a.score)

      return scored.slice(0, maxDucksInView).map((entry) => entry.duck)
    }

    return withPopularity
      .sort((a, b) => b.popularity - a.popularity || b.duck.createdAt - a.duck.createdAt)
      .slice(0, maxDucksInView)
      .map((entry) => entry.duck)
  }, [ducks, pondViewMode, maxDucksInView, randomSeed])

  const selectedDuck = useMemo(() => {
    const duck = ducks.find((entry) => entry.id === selectedDuckId) ?? null
    if (!duck) return null
    return duck
  }, [ducks, selectedDuckId])

  const galleryDucks = useMemo(() => {
    if (galleryViewMode === 'newest') {
      return [...ducks].sort((a, b) => b.createdAt - a.createdAt)
    }

    if (galleryViewMode === 'random') {
      return [...ducks]
        .map((duck) => ({
          duck,
          score: Math.sin(duck.createdAt * 0.001 + galleryRandomSeed * 1000 + duck.id.length),
        }))
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.duck)
    }

    return [...ducks].sort((a, b) => b.clickCount - a.clickCount || b.createdAt - a.createdAt)
  }, [ducks, galleryViewMode, galleryRandomSeed])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const { data, error } = await supabase
        .from('drawings')
        .select('*')
        .eq('world_id', selectedWorldId)
        .order('created_at', { ascending: false })
        .limit(200)

      if (cancelled || error || !data) return

      setServerConnected(true)
      const incoming = (data as DrawingRow[]).map(rowToDuck)
      setWorldStates((current) => ({
        ...current,
        [selectedWorldId]: {
          ...current[selectedWorldId],
          ducks: mergeDuckList(current[selectedWorldId].ducks, incoming),
        },
      }))
    }

    void load()

    const channel = supabase
      .channel(`drawings:${selectedWorldId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'drawings', filter: `world_id=eq.${selectedWorldId}` },
        (payload) => {
          const duck = rowToDuck(payload.new as DrawingRow)
          setWorldStates((current) => ({
            ...current,
            [selectedWorldId]: {
              ...current[selectedWorldId],
              ducks: mergeDuckList(current[selectedWorldId].ducks, [duck]),
            },
          }))
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [selectedWorldId])

  const registerDuckClick = (duckId: string) => {
    setSelectedDuckId(duckId)
    setDucks((current) =>
      current.map((entry) =>
        entry.id === duckId
          ? { ...entry, clickCount: entry.clickCount + 1 }
          : entry,
      ),
    )

    void supabase
      .from('likes')
      .insert({ drawing_id: duckId, user_key: USER_KEY })
      .then(({ error }) => {
        if (error) return
        setDucks((current) =>
          current.map((entry) =>
            entry.id === duckId
              ? { ...entry, clickCount: entry.clickCount + 1 }
              : entry,
          ),
        )
      })
  }

  const previewFrameIndex = useMemo(() => {
    if (draftFrames.length === 0) return 0
    if (!previewPlaying) return activeFrameIndex

    const seconds = previewClock / 10
    return Math.floor(seconds * draftAnimationFps) % draftFrames.length
  }, [draftFrames, activeFrameIndex, previewPlaying, previewClock, draftAnimationFps])

  const previewFrameArt = draftFrames[previewFrameIndex] ?? draftArt

  const previousFrameArt = useMemo(() => {
    if (activeFrameIndex <= 0) return []
    return draftFrames[activeFrameIndex - 1] ?? []
  }, [activeFrameIndex, draftFrames])

  const totalDrawPoints = draftFrames.reduce(
    (sum, frame) => sum + frame.reduce((frameSum, stroke) => frameSum + stroke.points.length, 0),
    0,
  )

  const fillAtPoint = (point: Point) => {
    const radius = Math.max(3.5, brushSize)
    const radiusSquared = radius * radius
    const fillColor = brushColor

    setActiveFrameArt((current) => {
      let targetIndex = -1

      for (let i = current.length - 1; i >= 0; i -= 1) {
        const stroke = current[i]
        const touches = stroke.points.some((entry) => {
          const dx = entry.x - point.x
          const dy = entry.y - point.y
          return dx * dx + dy * dy <= radiusSquared
        })

        if (touches) {
          targetIndex = i
          break
        }
      }

      if (targetIndex < 0) return current

      return current.map((stroke, idx) => {
        if (idx !== targetIndex) return stroke
        if (stroke.points.length >= 3) {
          return {
            ...stroke,
            closed: true,
            fill: fillColor,
            color: stroke.color,
          }
        }
        return {
          ...stroke,
          color: fillColor,
        }
      })
    })
  }

  const interpolatePoints = (from: Point, to: Point) => {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const distance = Math.hypot(dx, dy)
    if (distance <= 0.5) return [to]
    const step = 1.2
    const count = Math.max(1, Math.floor(distance / step))
    const points: Point[] = []
    for (let i = 1; i <= count; i += 1) {
      const t = i / count
      points.push({
        x: from.x + dx * t,
        y: from.y + dy * t,
      })
    }
    return points
  }

  const getDrawPoint = (event: React.PointerEvent<SVGSVGElement>): Point | null => {
    const surface = drawSurfaceRef.current
    if (!surface) return null

    const svgPoint = surface.createSVGPoint()
    svgPoint.x = event.clientX
    svgPoint.y = event.clientY

    const ctm = surface.getScreenCTM()
    if (!ctm) return null
    const local = svgPoint.matrixTransform(ctm.inverse())

    if (local.x < DRAW_MIN || local.x > DRAW_MAX || local.y < DRAW_MIN || local.y > DRAW_MAX) {
      return null
    }

    const x = clamp(local.x, DRAW_MIN, DRAW_MAX)
    const y = clamp(local.y, DRAW_MIN, DRAW_MAX)
    return { x, y }
  }

  const startStroke = (event: React.PointerEvent<SVGSVGElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    activePointerIdRef.current = event.pointerId

    const point = getDrawPoint(event)
    if (!point) return
    setDrawError('')

    if (tool === 'fill') {
      fillAtPoint(point)
      setRedoArt([])
      rainbowLastPointRef.current = null
      return
    }

    setIsDrawing(true)
    if (rainbowPencil) {
      rainbowLastPointRef.current = point
    }
    const activeColor = rainbowPencil ? rainbowColorFromHue(rainbowHueRef.current) : brushColor
    setActiveFrameArt((current) => [...current, { points: [point], color: activeColor, size: brushSize }])
    setRedoArt([])
  }

  const extendStroke = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing || activePointerIdRef.current !== event.pointerId) return
    const point = getDrawPoint(event)
    if (!point) {
      stopStroke(event)
      return
    }

    if (rainbowPencil) {
      setActiveFrameArt((current) => {
        const from = rainbowLastPointRef.current
        if (!from) {
          rainbowLastPointRef.current = point
          return current
        }

        const interpolated = interpolatePoints(from, point)
        if (interpolated.length === 0) return current

        const segments: Stroke[] = []
        let previous = from
        let hue = rainbowHueRef.current

        for (const nextPoint of interpolated) {
          hue = (hue + 4) % 360
          segments.push({
            points: [previous, nextPoint],
            color: rainbowColorFromHue(hue),
            size: brushSize,
          })
          previous = nextPoint
        }

        rainbowHueRef.current = hue
        rainbowLastPointRef.current = point
        return [...current, ...segments]
      })
      return
    }

    setActiveFrameArt((current) => {
      if (current.length === 0) return current
      const next = [...current]
      const lastStroke = next[next.length - 1]
      const lastPoint = lastStroke.points[lastStroke.points.length - 1]
      const fill = lastPoint ? interpolatePoints(lastPoint, point) : [point]
      next[next.length - 1] = {
        ...lastStroke,
        points: [...lastStroke.points, ...fill],
      }
      return next
    })
  }

  const stopStroke = (event?: React.PointerEvent<SVGSVGElement>) => {
    if (event && activePointerIdRef.current === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    activePointerIdRef.current = null
    rainbowLastPointRef.current = null
    setIsDrawing(false)
  }

  const undoStroke = () => {
    setActiveFrameArt((current) => {
      if (current.length === 0) return current
      const next = [...current]
      const removed = next.pop()
      if (removed) {
        setRedoArt((redo) => [...redo, removed])
      }
      return next
    })
  }

  const redoStroke = () => {
    setRedoArt((currentRedo) => {
      if (currentRedo.length === 0) return currentRedo
      const nextRedo = [...currentRedo]
      const restored = nextRedo.pop()
      if (restored) {
        setActiveFrameArt((current) => [...current, restored])
      }
      return nextRedo
    })
  }

  const selectFrame = (index: number) => {
    setActiveFrameIndex(index)
    setRedoArt([])
    setPreviewPlaying(false)
  }

  const addFrame = () => {
    if (draftFrames.length >= MAX_ANIMATION_FRAMES) return
    setDraftFrames((current) => [...current, []])
    setActiveFrameIndex(draftFrames.length)
    setRedoArt([])
    setPreviewPlaying(false)
  }

  const duplicateFrame = () => {
    if (draftFrames.length >= MAX_ANIMATION_FRAMES) return
    setDraftFrames((current) => [...current, cloneArt(current[activeFrameIndex] ?? [])])
    setActiveFrameIndex(draftFrames.length)
    setRedoArt([])
    setPreviewPlaying(false)
  }

  const removeActiveFrame = () => {
    if (draftFrames.length <= 1) return
    setDraftFrames((current) => current.filter((_, index) => index !== activeFrameIndex))
    setActiveFrameIndex((current) => Math.max(0, Math.min(current - 1, draftFrames.length - 2)))
    setRedoArt([])
    setPreviewPlaying(false)
  }

  const addDuck = () => {
    if (ducks.length >= MAX_DUCKS) return
    if (totalDrawPoints < 8) {
      setDrawError('Draw your duck first, add a few strokes to release it.')
      return
    }

    const clean = newName.trim()
    const savedFrames = draftFrames
      .map((frame) => cloneArt(frame))
      .filter((frame) => frame.length > 0)

    const duck = createDuck({
      name: clean.length > 0 ? clean : `${pickOne(NAME_BANK)} ${Math.floor(Math.random() * 90 + 10)}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      art: cloneArt(savedFrames[0] ?? []),
      animationFrames: savedFrames,
      animationFps: draftAnimationFps,
    })
    setDucks((current) => [duck, ...current])
    setSelectedDuckId(duck.id)

    void supabase.from('drawings').insert({
      id: duck.id,
      world_id: selectedWorldId,
      name: duck.name,
      art: duck.art,
      animation_frames: duck.animationFrames,
      animation_fps: duck.animationFps,
      likes_count: 0,
    })

    setTimeline((current) => [
      {
        id: randomId(),
        duckId: duck.id,
        summary: `${duck.name} arrived in ${activePond.name}`,
        createdAt: Date.now(),
        pondId: duck.pondId,
      },
      ...current,
    ])
    setNewName('')
    setDraftFrames([getStarterArtForWorld(selectedWorldId)])
    setActiveFrameIndex(0)
    setDraftAnimationFps(DEFAULT_ANIMATION_FPS)
    setPreviewPlaying(false)
    setPreviewClock(0)
    setRedoArt([])
    setDrawError('')
    setScreen('pond')
  }

  const startOverSketch = () => {
    setDraftFrames([getStarterArtForWorld(selectedWorldId)])
    setActiveFrameIndex(0)
    setPreviewPlaying(false)
    setPreviewClock(0)
    setRedoArt([])
    setDrawError('')
  }

  const clearSketch = () => {
    setActiveFrameArt(() => [])
    setRedoArt([])
    setDrawError('')
  }

  const isPondScreen = screen === 'pond'
  const showHeroHeader = screen === 'gallery'

  return (
    <div className="app-shell">
      {showHeroHeader ? (
      <header className="hero-header">
        <div>
          <p className="eyebrow">The Public Doodle</p>
          <h1>{activeWorld.title}</h1>
          <p className="hero-copy">
            Build your flock.
          </p>
        </div>
        <div className="hero-stats">
          <div>
            <span>Active {activeWorld.residentPlural}</span>
            <strong>{ducks.length}</strong>
          </div>
          <div>
            <span>Current Pond</span>
            <strong>{activePond.name}</strong>
          </div>
          <div>
            <span>In View</span>
            <strong>{visiblePondDucks.length}</strong>
          </div>
          <div>
            <span>World</span>
            <strong>{activeWorld.title}</strong>
          </div>
        </div>
      </header>
      ) : null}

      {screen !== 'home' && !isPondScreen ? (
      <section className="view-switch card">
        <button
          type="button"
          onClick={() => setScreen('home')}
        >
          Worlds
        </button>
        <button
          type="button"
          onClick={() => setScreen('pond')}
        >
          Visit World
        </button>
        <button
          type="button"
          className={screen === 'gallery' ? 'active' : ''}
          onClick={() => setScreen('gallery')}
        >
          Gallery
        </button>
        <button
          type="button"
          className={screen === 'draw' ? 'active' : ''}
          onClick={() => setScreen('draw')}
        >
          {activeWorld.drawLabel}
        </button>
      </section>
      ) : null}

      {screen === 'home' ? (
        <main className="world-select-layout card">
          <section className="world-select-head">
            <h2>Choose a World</h2>
            <p className="meta">Each world uses the same tools with a different drawing theme.</p>
            <p className="meta">Community: {serverConnected ? 'Connected, drawings are shared' : 'Loading community drawings...'}</p>
          </section>
          <section className="world-grid">
            {WORLD_IDS.map((worldId) => {
              const world = WORLD_CONFIGS[worldId]
              const residents = worldStates[worldId].ducks.length
              return (
                <button
                  key={worldId}
                  type="button"
                  className={`world-card ${selectedWorldId === worldId ? 'active' : ''}`}
                  onClick={() => chooseWorld(worldId)}
                >
                  <h3>{world.title}</h3>
                  <p className="meta">{world.drawLabel}</p>
                  <p className="meta">{world.galleryLabel}</p>
                  <p className="meta strong">{residents} {world.residentPlural}</p>
                </button>
              )
            })}
          </section>
        </main>
      ) : screen === 'pond' ? (
        <>
          <section className="pond-unified-toolbar card">
            <div className="pond-unified-top">
              <div className="view-switch pond-inline-switch">
                <button
                  type="button"
                  onClick={() => setScreen('home')}
                >
                  Worlds
                </button>
                <button
                  type="button"
                  className="active"
                  onClick={() => setScreen('pond')}
                >
                  Visit World
                </button>
                <button
                  type="button"
                  onClick={() => setScreen('gallery')}
                >
                  Gallery
                </button>
                <button
                  type="button"
                  onClick={() => setScreen('draw')}
                >
                  {activeWorld.drawLabel}
                </button>
              </div>

              <div>
                <h2>{activeWorld.title}</h2>
                <p className="meta">Residents: {pondDucks.length} | In view: {visiblePondDucks.length} | Total: {ducks.length}</p>
                <a
                  className="donation-link"
                  href="https://buy.stripe.com/14AcN6bWU9YY0Nw1vH3sI00"
                  target="_blank"
                  rel="noreferrer"
                >
                  Buy me a coffee
                </a>
              </div>
            </div>

            <div className="pond-unified-controls">
              <div>
                <p className="meta strong">View</p>
                <div className="view-modes pond-toolbar-modes">
                  <button
                    type="button"
                    className={pondViewMode === 'popular' ? 'active' : ''}
                    onClick={() => setPondViewMode('popular')}
                  >
                    Most Popular
                  </button>
                  <button
                    type="button"
                    className={pondViewMode === 'newest' ? 'active' : ''}
                    onClick={() => setPondViewMode('newest')}
                  >
                    Newest
                  </button>
                  <button
                    type="button"
                    className={pondViewMode === 'random' ? 'active' : ''}
                    onClick={() => {
                      setPondViewMode('random')
                      setRandomSeed(Math.random())
                    }}
                  >
                    Random
                  </button>
                </div>
              </div>

              <label>
                Residents in View: {maxDucksInView}
                <input
                  type="range"
                  min={6}
                  max={160}
                  step={1}
                  value={maxDucksInView}
                  onChange={(event) => setMaxDucksInView(Number(event.target.value))}
                />
              </label>

              <label>
                Character Size: {duckSizePx}px
                <input
                  type="range"
                  min={34}
                  max={120}
                  step={1}
                  value={duckSizePx}
                  onChange={(event) => setDuckSizePx(Number(event.target.value))}
                />
              </label>
            </div>
          </section>

          <main className="pond-main">
            <section className={`pond card ${pondThemeClass} pond-main-focus`}>
              <div className="pond-title">
                <h3>{activePond.name}</h3>
                <span>{pondDucks.length} {activeWorld.residentPlural.toLowerCase()} currently here</span>
              </div>
              <div className="pond-grid" />

              {visiblePondDucks.map((duck) => {
                const visualHalf = duckSizePx / 2
                const duckFrames = duck.animationFrames.length > 0 ? duck.animationFrames : [duck.art]
                const animationSecond = pondAnimationClock * 0.12
                const animatedFrameIndex =
                  duckFrames.length > 1
                    ? Math.floor(animationSecond * clamp(duck.animationFps, 1, 12)) % duckFrames.length
                    : 0
                const animatedArt = duckFrames[animatedFrameIndex] ?? duck.art
                return (
                  <button
                    key={duck.id}
                    type="button"
                    className={`duck ${selectedDuckId === duck.id ? 'active' : ''}`}
                    style={{
                      left: `${duck.x}%`,
                      top: `${duck.y}%`,
                      borderColor: SINGLE_POND.color,
                      width: `${duckSizePx}px`,
                      height: `${duckSizePx}px`,
                      marginLeft: `-${visualHalf}px`,
                      marginTop: `-${visualHalf}px`,
                    }}
                    onClick={() => registerDuckClick(duck.id)}
                    title={`${duck.name} | ${duck.state}`}
                  >
                    <svg
                      className="duck-art"
                      viewBox="0 0 100 100"
                      aria-hidden="true"
                      style={{ transform: duck.facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)' }}
                    >
                      {animatedArt.map((stroke, index) =>
                        renderStroke(stroke, `${duck.id}-${index}`, 0.95),
                      )}
                    </svg>
                  </button>
                )
              })}
            </section>

          </main>

          {selectedDuck ? (
            <div className="duck-modal-backdrop" onClick={() => setSelectedDuckId(null)}>
              <section className="duck-modal card" onClick={(event) => event.stopPropagation()}>
                <div className="duck-modal-head">
                  <h2>{activeWorld.residentSingular} Profile</h2>
                  <button type="button" className="duck-modal-close" onClick={() => setSelectedDuckId(null)}>
                    Close
                  </button>
                </div>
                <p className="duck-name">{selectedDuck.name}</p>
                <p className="badge-line">
                  <span>{SINGLE_POND.name}</span>
                  <span>{selectedDuck.state}</span>
                </p>

                <p className="meta">Current state: {selectedDuck.state}</p>
                <p className="meta">Clicks: {selectedDuck.clickCount}</p>
              </section>
            </div>
          ) : null}

        </>
      ) : screen === 'gallery' ? (
        <main className="gallery-layout card">
          <section className="gallery-toolbar">
            <div>
              <h2>{activeWorld.galleryLabel}</h2>
              <p className="meta">Every {activeWorld.residentSingular.toLowerCase()} your world has created, all in one place.</p>
            </div>
            <div className="view-modes gallery-modes">
              <button
                type="button"
                className={galleryViewMode === 'newest' ? 'active' : ''}
                onClick={() => setGalleryViewMode('newest')}
              >
                Newest
              </button>
              <button
                type="button"
                className={galleryViewMode === 'popular' ? 'active' : ''}
                onClick={() => setGalleryViewMode('popular')}
              >
                Popular
              </button>
              <button
                type="button"
                className={galleryViewMode === 'random' ? 'active' : ''}
                onClick={() => {
                  setGalleryViewMode('random')
                  setGalleryRandomSeed(Math.random())
                }}
              >
                Random
              </button>
            </div>
          </section>

          <section className="gallery-grid">
            {galleryDucks.map((duck) => {
              return (
                <button
                  key={duck.id}
                  type="button"
                  className="gallery-card"
                  onClick={() => registerDuckClick(duck.id)}
                  title={`${duck.name} | clicks ${duck.clickCount}`}
                >
                  <div className="gallery-art-wrap" style={{ borderColor: SINGLE_POND.color }}>
                    <svg className="duck-art" viewBox="0 0 100 100" aria-hidden="true">
                      {duck.art.map((stroke, index) => renderStroke(stroke, `${duck.id}-gallery-${index}`, 0.95))}
                    </svg>
                  </div>
                  <p className="duck-name">{duck.name}</p>
                  <p className="meta">Clicks: {duck.clickCount}</p>
                </button>
              )
            })}
          </section>
        </main>
      ) : (
        <main className="draw-layout card">
          <section className="draw-topbar">
            <div>
              <h2>{activeWorld.drawLabel}</h2>
              <p className="meta">Draw one frame for a still {activeWorld.residentSingular.toLowerCase()}, or up to 5 frames to animate it.</p>
            </div>
            <div className="draw-tools">
              <button
                type="button"
                className={tool === 'pencil' ? 'active' : ''}
                onClick={() => setTool('pencil')}
              >
                Pencil
              </button>
              <button
                type="button"
                className={tool === 'fill' ? 'active' : ''}
                onClick={() => setTool('fill')}
              >
                Fill Bucket
              </button>
            </div>
          </section>

          <section className="draw-main">
            <div className="draw-board-panel">
              <div className="draw-canvas-wrap">
              <svg
                ref={drawSurfaceRef}
                className="draw-surface full"
                viewBox="0 0 100 100"
                onPointerDown={startStroke}
                onPointerMove={extendStroke}
                onPointerUp={stopStroke}
                onPointerLeave={stopStroke}
              >
                {onionSkinEnabled && previousFrameArt.length > 0 ? (
                  <g className="onion-skin-layer">
                    {previousFrameArt.map((stroke, index) =>
                      renderStroke(stroke, `onion-${index}`, 1),
                    )}
                  </g>
                ) : null}
                {draftArt.map((stroke, index) => renderStroke(stroke, `draft-${index}`, 1))}
              </svg>
              </div>
            </div>

            <section className="draw-controls">
              <div className="draw-quick-actions">
                <button type="button" onClick={undoStroke} disabled={draftArt.length === 0}>
                  Undo
                </button>
                <button type="button" onClick={redoStroke} disabled={redoArt.length === 0}>
                  Redo
                </button>
                <button type="button" className="ghost" onClick={clearSketch}>
                  Clear
                </button>
                <button type="button" className="ghost" onClick={startOverSketch}>
                  Start Over
                </button>
              </div>
              <section className="draw-frames">
                <div className="draw-frames-head">
                  <p className="meta strong">Frames {draftFrames.length}/{MAX_ANIMATION_FRAMES}</p>
                  <div className="draw-frame-actions">
                    <button type="button" onClick={addFrame} disabled={draftFrames.length >= MAX_ANIMATION_FRAMES}>
                      Add
                    </button>
                    <button type="button" onClick={duplicateFrame} disabled={draftFrames.length >= MAX_ANIMATION_FRAMES}>
                      Duplicate
                    </button>
                    <button type="button" className="ghost" onClick={removeActiveFrame} disabled={draftFrames.length <= 1}>
                      Delete
                    </button>
                  </div>
                </div>
                <div className="frame-strip" role="tablist" aria-label="Animation frames">
                  {draftFrames.map((frame, index) => (
                    <button
                      key={`frame-${index}`}
                      type="button"
                      className={`frame-thumb ${index === activeFrameIndex ? 'active' : ''}`}
                      onClick={() => selectFrame(index)}
                      role="tab"
                      aria-selected={index === activeFrameIndex}
                      title={`Frame ${index + 1}`}
                    >
                      <span>F{index + 1}</span>
                      <svg viewBox="0 0 100 100" aria-hidden="true">
                        {frame.map((stroke, strokeIndex) =>
                          renderStroke(stroke, `thumb-${index}-${strokeIndex}`, 0.9),
                        )}
                      </svg>
                    </button>
                  ))}
                </div>
              </section>
              <div className="draw-adjustments">
                <label>
                  Animation Speed: {draftAnimationFps} fps
                  <input
                    type="range"
                    min={1}
                    max={12}
                    step={1}
                    value={draftAnimationFps}
                    onChange={(event) => setDraftAnimationFps(Number(event.target.value))}
                  />
                </label>
                <label>
                  Color
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(event) => setBrushColor(event.target.value)}
                  />
                </label>
                <label>
                  Brush Size: {brushSize}
                  <input
                    type="range"
                    min={1}
                    max={24}
                    step={1}
                    value={brushSize}
                    onChange={(event) => setBrushSize(Number(event.target.value))}
                  />
                </label>
                <label>
                  Rainbow Pencil
                  <input
                    type="checkbox"
                    checked={rainbowPencil}
                    onChange={(event) => setRainbowPencil(event.target.checked)}
                    disabled={tool !== 'pencil'}
                  />
                </label>
                <label>
                  Onion Skin
                  <input
                    type="checkbox"
                    checked={onionSkinEnabled}
                    onChange={(event) => setOnionSkinEnabled(event.target.checked)}
                    disabled={activeFrameIndex === 0}
                  />
                </label>
                <p className="meta">Onion Skin shows the previous frame while you draw.</p>
              </div>
              <div className="draw-preview card">
                <div className="draw-preview-head">
                  <p className="meta strong">Preview</p>
                  <button
                    type="button"
                    className={previewPlaying ? 'active' : ''}
                    onClick={() => setPreviewPlaying((value) => !value)}
                    disabled={draftFrames.length <= 1}
                  >
                    {previewPlaying ? 'Pause' : 'Play'}
                  </button>
                </div>
                <svg className="draw-preview-art" viewBox="0 0 100 100" aria-hidden="true">
                  {previewFrameArt.map((stroke, index) => renderStroke(stroke, `preview-${index}`, 1))}
                </svg>
                <p className="meta">Frame {previewFrameIndex + 1} of {draftFrames.length}</p>
              </div>
              <label>
                Name
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Type a duck name"
                />
              </label>
              <div className="button-row draw-actions">
                <button type="button" onClick={addDuck}>
                  Release {activeWorld.residentSingular}
                </button>
                <button type="button" className="ghost" onClick={() => setScreen('pond')}>
                  Back to World
                </button>
              </div>
              {drawError ? <p className="draw-error">{drawError}</p> : null}
              <p className="meta">Capacity {ducks.length}/{MAX_DUCKS}</p>
            </section>
          </section>
        </main>
      )}
    </div>
  )
}

export default App
