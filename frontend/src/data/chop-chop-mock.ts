export const STATION_COLORS = {
  prep: '#1F4FD8',    // blue
  stove: '#E8583A',   // red-orange
  plating: '#1E9E5A', // green
  assist: '#E06A9A',  // pink
}

export const PLAYER_COLORS = [
  '#1F4FD8', // blue
  '#E8583A', // red-orange
  '#1E9E5A', // green
  '#E06A9A', // pink
]

export interface MockPlayer {
  id: string
  name: string
  station: 'prep' | 'stove' | 'plating'
  color: string
  avatar: string
  joinedAt: number
  isNewest?: boolean
}

export interface MockOrder {
  id: string
  dishName: string
  customerName: string
  ingredients: string[]
  priority: number // 1-3, lower = more urgent
  createdAt: number
}

export const MOCK_PLAYERS: MockPlayer[] = [
  {
    id: '1',
    name: 'Alex',
    station: 'prep',
    color: PLAYER_COLORS[0],
    avatar: 'A',
    joinedAt: Date.now() - 30000,
  },
  {
    id: '2',
    name: 'Jordan',
    station: 'stove',
    color: PLAYER_COLORS[1],
    avatar: 'J',
    joinedAt: Date.now() - 20000,
  },
  {
    id: '3',
    name: 'Casey',
    station: 'plating',
    color: PLAYER_COLORS[2],
    avatar: 'C',
    joinedAt: Date.now() - 10000,
    isNewest: true,
  },
]

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: '1',
    dishName: 'Pasta Marinara',
    customerName: 'Emma',
    ingredients: ['pasta', 'tomato', 'basil'],
    priority: 1,
    createdAt: Date.now() - 60000,
  },
  {
    id: '2',
    dishName: 'Grilled Salmon',
    customerName: 'Marcus',
    ingredients: ['salmon', 'lemon', 'dill'],
    priority: 2,
    createdAt: Date.now() - 40000,
  },
  {
    id: '3',
    dishName: 'Veggie Stir-fry',
    customerName: 'Sam',
    ingredients: ['broccoli', 'carrot', 'snap pea'],
    priority: 3,
    createdAt: Date.now() - 20000,
  },
]

export const AVAILABLE_CHEFS = [
  { id: 'chef1', name: 'Gordon', initials: 'G', color: PLAYER_COLORS[0] },
  { id: 'chef2', name: 'Julia', initials: 'J', color: PLAYER_COLORS[1] },
  { id: 'chef3', name: 'Bobby', initials: 'B', color: PLAYER_COLORS[2] },
  { id: 'chef4', name: 'Alice', initials: 'A', color: PLAYER_COLORS[3] },
]

export const ROOM_CODE = 'CHOP'

export interface Ingredient {
  id: string
  name: string
  station: 'prep' | 'stove' | 'plating'
  imageEmoji: string
}

export interface QueuedItem {
  id: string
  orderId: string
  ingredientId: string
  progress: number // 0-100
  currentStation: 'prep' | 'stove' | 'plating'
}

export interface GameplayState {
  roundNumber: number
  timeRemaining: number // seconds
  teamScore: number
  orders: MockOrder[]
  queue: QueuedItem[]
  players: MockPlayer[]
  backedUpStations: ('prep' | 'stove' | 'plating')[]
}

export const MOCK_INGREDIENTS: Ingredient[] = [
  { id: 'pasta', name: 'Pasta', station: 'prep', imageEmoji: '🍝' },
  { id: 'tomato', name: 'Tomato', station: 'prep', imageEmoji: '🍅' },
  { id: 'basil', name: 'Basil', station: 'stove', imageEmoji: '🌿' },
  { id: 'salmon', name: 'Salmon', station: 'stove', imageEmoji: '🐟' },
  { id: 'lemon', name: 'Lemon', station: 'plating', imageEmoji: '🍋' },
  { id: 'plate', name: 'Plate', station: 'plating', imageEmoji: '🍽️' },
]

export const MOCK_GAMEPLAY_STATE: GameplayState = {
  roundNumber: 1,
  timeRemaining: 180,
  teamScore: 4200,
  orders: MOCK_ORDERS,
  queue: [
    {
      id: 'q1',
      orderId: '1',
      ingredientId: 'pasta',
      progress: 50,
      currentStation: 'prep',
    },
    {
      id: 'q2',
      orderId: '2',
      ingredientId: 'salmon',
      progress: 30,
      currentStation: 'stove',
    },
  ],
  players: MOCK_PLAYERS,
  backedUpStations: [],
}
