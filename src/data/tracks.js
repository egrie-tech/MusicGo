// MusicGo "Pokédex": every catchable track with forms, costumes, shiny/regional
// variants, mega data, shadow availability, buddy distance and base stats.
// atk/def/sta mirror the classic attack/defense/stamina model.
export const GENRES = ['Pop', 'Hip-Hop', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Indie', 'R&B', 'Latin', 'K-Pop']

export const RARITY = {
  common:    { label: 'Common',    color: '#9ca3af', xp: 10,  catchBase: 0.85, cpMult: 1.0 },
  uncommon:  { label: 'Uncommon',  color: '#22c55e', xp: 25,  catchBase: 0.65, cpMult: 1.15 },
  rare:      { label: 'Rare',      color: '#3b82f6', xp: 60,  catchBase: 0.45, cpMult: 1.35 },
  epic:      { label: 'Epic',      color: '#a855f7', xp: 150, catchBase: 0.25, cpMult: 1.7 },
  legendary: { label: 'Legendary', color: '#f59e0b', xp: 400, catchBase: 0.10, cpMult: 2.4 },
}

const t = (o) => ({
  forms: ['Original'], costume: false, regional: null, mega: null, shadow: true,
  buddyKm: 3, shinyChance: 0.01, ...o,
  stats: { catchRate: o.catchRate ?? RARITY[o.rarity].catchBase },
})

export const TRACKS = [
  t({ id: 1,  title: 'Midnight Pulse', artist: 'Nova Ray',      album: 'Neon Nights',      genre: 'Electronic', rarity: 'common',    atk: 82, def: 78, sta: 90,  buddyKm: 3 }),
  t({ id: 2,  title: 'City Lights',    artist: 'Aria Voss',     album: 'Afterglow',        genre: 'Pop',        rarity: 'common',    atk: 70, def: 85, sta: 88,  buddyKm: 3 }),
  t({ id: 3,  title: 'Concrete Jungle',artist: 'MC Flow',       album: 'Streets',          genre: 'Hip-Hop',    rarity: 'common',    atk: 75, def: 60, sta: 95,  buddyKm: 3 }),
  t({ id: 4,  title: 'Static Dreams',  artist: 'The Voltz',     album: 'Amplify',          genre: 'Rock',       rarity: 'common',    atk: 88, def: 55, sta: 85,  buddyKm: 3 }),
  t({ id: 5,  title: 'Blue Note',      artist: 'Miles & Co',    album: 'Smoke & Brass',    genre: 'Jazz',       rarity: 'uncommon',  atk: 45, def: 40, sta: 70,  buddyKm: 3 }),
  t({ id: 6,  title: 'Moonlight Sonata (Remix)', artist: 'L. Beethoven', youtubeQuery: 'Beethoven Moonlight Sonata', album: 'Classics Reborn', genre: 'Classical', rarity: 'rare', atk: 30, def: 20, sta: 60, buddyKm: 5, regional: 'Kanto' }),
  t({ id: 7,  title: 'Paper Planes',   artist: 'Indie Folk',    album: 'Lo-Fi Mornings',   genre: 'Indie',      rarity: 'common',    atk: 50, def: 55, sta: 75,  buddyKm: 3 }),
  t({ id: 8,  title: 'Slow Burn',      artist: 'Velvet Rose',   album: 'Velvet',           genre: 'R&B',        rarity: 'uncommon',  atk: 40, def: 70, sta: 78,  buddyKm: 3 }),
  t({ id: 9,  title: 'Fiesta Caliente',artist: 'Los Ritmos',    album: 'Carnaval',         genre: 'Latin',      rarity: 'common',    atk: 80, def: 92, sta: 82,  buddyKm: 3, forms: ['Original', 'Salsa', 'Bachata'] }),
  t({ id: 10, title: 'Starlight',      artist: 'NEON7',         album: 'K-Wave',           genre: 'K-Pop',      rarity: 'uncommon',  atk: 85, def: 90, sta: 86,  buddyKm: 3, costume: true, forms: ['Original', 'Stage Outfit'] }),
  t({ id: 11, title: 'Deep Ocean',     artist: 'Abyss',         album: 'Depths',           genre: 'Electronic', rarity: 'rare',      atk: 60, def: 65, sta: 80,  buddyKm: 5 }),
  t({ id: 12, title: 'Golden Hour',    artist: 'Sunset Drive',  album: 'West Coast',       genre: 'Pop',        rarity: 'uncommon',  atk: 65, def: 75, sta: 84,  buddyKm: 3 }),
  t({ id: 13, title: 'Riot',           artist: 'Broken Glass',  album: 'Shatter',          genre: 'Rock',       rarity: 'rare',      atk: 95, def: 50, sta: 88,  buddyKm: 5, shadow: true }),
  t({ id: 14, title: 'Freestyle Friday', artist: 'DJ Cipher',   album: 'Mixtape Vol.1',    genre: 'Hip-Hop',    rarity: 'uncommon',  atk: 78, def: 68, sta: 83,  buddyKm: 3, forms: ['Original', 'Live Freestyle'] }),
  t({ id: 15, title: 'Smoky Room',     artist: 'Jazz Cats',     album: 'After Hours',      genre: 'Jazz',       rarity: 'rare',      atk: 35, def: 30, sta: 65,  buddyKm: 5 }),
  t({ id: 16, title: 'Requiem',        artist: 'Orchestra Nova', youtubeQuery: 'Mozart Requiem Lacrimosa',album: 'Eternal',          genre: 'Classical',  rarity: 'epic',      atk: 25, def: 15, sta: 70,  buddyKm: 10 }),
  t({ id: 17, title: 'Wanderlust',     artist: 'The Drifters',  album: 'Roads',            genre: 'Indie',      rarity: 'uncommon',  atk: 55, def: 60, sta: 76,  buddyKm: 3 }),
  t({ id: 18, title: 'Midnight Kiss',  artist: 'Sable',         album: 'After Dark',       genre: 'R&B',        rarity: 'rare',      atk: 45, def: 78, sta: 80,  buddyKm: 5, regional: 'Johto' }),
  t({ id: 19, title: 'Baila',          artist: 'Carmen Sol',    album: 'Pasión',           genre: 'Latin',      rarity: 'uncommon',  atk: 75, def: 95, sta: 81,  buddyKm: 3 }),
  t({ id: 20, title: 'Catch Me',       artist: 'IDOL-X',        album: 'Stage',            genre: 'K-Pop',      rarity: 'rare',      atk: 90, def: 92, sta: 87,  buddyKm: 5, costume: true }),
  t({ id: 21, title: 'Aurora',         artist: 'Lumina',        album: 'Skyline',          genre: 'Electronic', rarity: 'epic',      atk: 70, def: 80, sta: 90,  buddyKm: 10, mega: { name: 'Mega Aurora', energy: 200, mult: 1.45 } }),
  t({ id: 22, title: 'Echoes',         artist: 'Hollow',        album: 'Void',             genre: 'Rock',       rarity: 'epic',      atk: 92, def: 48, sta: 89,  buddyKm: 10, mega: { name: 'Mega Echo', energy: 200, mult: 1.45 } }),
  t({ id: 23, title: 'Crown',          artist: 'Kingpin',       album: 'Throne',           genre: 'Hip-Hop',    rarity: 'epic',      atk: 85, def: 70, sta: 92,  buddyKm: 10, shadow: true }),
  t({ id: 24, title: 'Symphony No.9',  artist: 'Maestro', youtubeQuery: 'Beethoven Symphony No. 9 Ode to Joy',       album: 'Masterworks',      genre: 'Classical',  rarity: 'legendary', atk: 40, def: 25, sta: 100, buddyKm: 20 }),
  t({ id: 25, title: 'Neon Tokyo',     artist: 'Vapor',         album: 'City Pop',         genre: 'Electronic', rarity: 'legendary', atk: 88, def: 85, sta: 88,  buddyKm: 20, regional: 'Kanto' }),
  t({ id: 26, title: 'Heartbeat',      artist: 'Pulse',         album: 'Alive',            genre: 'Pop',        rarity: 'legendary', atk: 95, def: 90, sta: 95,  buddyKm: 20, costume: true }),
  t({ id: 27, title: 'Underground',    artist: 'Cipher',        album: 'Beneath',          genre: 'Hip-Hop',    rarity: 'rare',      atk: 72, def: 62, sta: 84,  buddyKm: 5, shadow: true }),
  t({ id: 28, title: 'Electric Feel',  artist: 'Synthwave',     album: 'Retro',            genre: 'Electronic', rarity: 'uncommon',  atk: 78, def: 72, sta: 82,  buddyKm: 3, forms: ['Original', '80s Mix'] }),
  t({ id: 29, title: 'Acoustic Rain',  artist: 'Willow',        album: 'Forest',           genre: 'Indie',      rarity: 'common',    atk: 40, def: 45, sta: 72,  buddyKm: 2 }),
  t({ id: 30, title: 'Soul Fire',      artist: 'Ember',         album: 'Heat',             genre: 'R&B',        rarity: 'epic',      atk: 60, def: 82, sta: 91,  buddyKm: 10, mega: { name: 'Mega Inferno', energy: 250, mult: 1.5 } }),
  t({ id: 31, title: 'Carnival',       artist: 'Brass Band',    album: 'Parade',           genre: 'Latin',      rarity: 'rare',      atk: 85, def: 90, sta: 86,  buddyKm: 5 }),
  t({ id: 32, title: 'Debut',          artist: 'Rookie',        album: 'First Step',       genre: 'K-Pop',      rarity: 'common',    atk: 75, def: 80, sta: 84,  buddyKm: 2 }),
  t({ id: 33, title: 'Lofi Study',     artist: 'Chill Beats',   album: 'Focus',            genre: 'Indie',      rarity: 'common',    atk: 30, def: 35, sta: 68,  buddyKm: 2 }),
  t({ id: 34, title: 'Anthem',         artist: 'United',        album: 'Together',         genre: 'Rock',       rarity: 'legendary', atk: 98, def: 60, sta: 92,  buddyKm: 20, mega: { name: 'Mega Anthem', energy: 300, mult: 1.55 } }),
  t({ id: 35, title: 'Smooth Operator',artist: 'Velvet',        album: 'Late Night',       genre: 'Jazz',       rarity: 'epic',      atk: 40, def: 50, sta: 82,  buddyKm: 10 }),
  t({ id: 36, title: 'Tango',          artist: 'Buenos Aires',  album: 'Dance',            genre: 'Latin',      rarity: 'epic',      atk: 70, def: 95, sta: 88,  buddyKm: 10 }),
  t({ id: 37, title: 'Galaxy',         artist: 'Cosmos',        album: 'Universe',         genre: 'Electronic', rarity: 'rare',      atk: 65, def: 70, sta: 83,  buddyKm: 5 }),
  t({ id: 38, title: 'Ballad',         artist: 'Crooner',       album: 'Love Songs',       genre: 'Pop',        rarity: 'common',    atk: 35, def: 40, sta: 74,  buddyKm: 2 }),
  t({ id: 39, title: 'Drumline',       artist: 'Percussion',    album: 'Beat',             genre: 'Rock',       rarity: 'uncommon',  atk: 90, def: 55, sta: 85,  buddyKm: 3 }),
  t({ id: 40, title: 'Whisper',        artist: 'Silent',        album: 'Quiet',            genre: 'Indie',      rarity: 'rare',      atk: 25, def: 30, sta: 78,  buddyKm: 5 }),
  t({ id: 41, title: 'Bass Drop',      artist: 'Subwoofer',     album: 'Low End',          genre: 'Electronic', rarity: 'uncommon',  atk: 85, def: 75, sta: 81,  buddyKm: 3 }),
  t({ id: 42, title: 'Rhyme Scheme',   artist: 'Lyricist',      album: 'Bars',             genre: 'Hip-Hop',    rarity: 'common',    atk: 70, def: 65, sta: 80,  buddyKm: 2 }),
  t({ id: 43, title: 'Serenade',       artist: 'Strings', youtubeQuery: 'Mozart Eine kleine Nachtmusik Serenade',       album: 'Romance',          genre: 'Classical',  rarity: 'uncommon',  atk: 30, def: 25, sta: 76,  buddyKm: 3 }),
  t({ id: 44, title: 'Funk It',        artist: 'Groove',        album: 'Funkadelic',       genre: 'R&B',        rarity: 'rare',      atk: 75, def: 88, sta: 85,  buddyKm: 5 }),
  t({ id: 45, title: 'K-Wave Anthem',  artist: 'IDOL-Y',        album: 'Debut',            genre: 'K-Pop',      rarity: 'epic',      atk: 92, def: 95, sta: 90,  buddyKm: 10 }),
  t({ id: 46, title: 'Crescendo',      artist: 'Maestro Cells', album: 'The Lost Session', genre: 'Classical',  rarity: 'legendary', atk: 99, def: 99, sta: 99,  buddyKm: 20, shadow: false }),
]

export const TRACK_BY_ID = Object.fromEntries(TRACKS.map(t => [t.id, t]))
export function getTrack(id) { return TRACK_BY_ID[id] }

// shiny roll helper
export function rollShiny(track) {
  return Math.random() < (track.shinyChance ?? 0.01)
}

export const GENRE_EMOJI = {
  Pop: '🎤', 'Hip-Hop': '🎧', Rock: '🎸', Electronic: '🎹', Jazz: '🎷',
  Classical: '🎻', Indie: '🍂', 'R&B': '💜', Latin: '💃', 'K-Pop': '⭐',
}
