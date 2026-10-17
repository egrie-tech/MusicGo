// Evolution chains: trackId -> { to: trackId, candy: number }
export const EVOLUTIONS = {
  32: { to: 10, candy: 25 },   // Debut -> Starlight
  7: { to: 17, candy: 25 },    // Paper Planes -> Wanderlust
  29: { to: 40, candy: 50 },   // Acoustic Rain -> Whisper
  9: { to: 19, candy: 25 },    // Fiesta Caliente -> Baila
  38: { to: 12, candy: 25 },   // Ballad -> Golden Hour
  42: { to: 14, candy: 25 },   // Rhyme Scheme -> Freestyle Friday
  33: { to: 7, candy: 25 },    // Lofi Study -> Paper Planes
  1: { to: 21, candy: 50 },    // Midnight Pulse -> Aurora
  4: { to: 22, candy: 50 },    // Static Dreams -> Echoes
  3: { to: 23, candy: 50 },    // Concrete Jungle -> Crown
  5: { to: 15, candy: 50 },    // Blue Note -> Smoky Room
  43: { to: 6, candy: 50 },    // Serenade -> Moonlight Sonata
}
export function getEvolution(id) { return EVOLUTIONS[id] || null }
