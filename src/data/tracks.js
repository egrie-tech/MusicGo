// MusicGo track catalog. Each track is a "creature" you can catch in the wild.
export const GENRES = ['Pop', 'Hip-Hop', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Indie', 'R&B', 'Latin', 'K-Pop']

export const RARITY = {
  common: { label: 'Common', color: '#9ca3af', xp: 10, catchBase: 0.85 },
  uncommon: { label: 'Uncommon', color: '#22c55e', xp: 25, catchBase: 0.65 },
  rare: { label: 'Rare', color: '#3b82f6', xp: 60, catchBase: 0.45 },
  epic: { label: 'Epic', color: '#a855f7', xp: 150, catchBase: 0.25 },
  legendary: { label: 'Legendary', color: '#f59e0b', xp: 400, catchBase: 0.12 },
}

const MOVES = {
  Pop: { fast: { name: 'Chorus', power: 8, type: 'Pop' }, charged: { name: 'Anthem', power: 35, type: 'Pop', energy: 50 } },
  'Hip-Hop': { fast: { name: 'Flow', power: 9, type: 'Hip-Hop' }, charged: { name: 'Verse Drop', power: 40, type: 'Hip-Hop', energy: 55 } },
  Rock: { fast: { name: 'Riff', power: 10, type: 'Rock' }, charged: { name: 'Solo', power: 45, type: 'Rock', energy: 60 } },
  Electronic: { fast: { name: 'Beat', power: 7, type: 'Electronic' }, charged: { name: 'Drop', power: 50, type: 'Electronic', energy: 65 } },
  Jazz: { fast: { name: 'Improv', power: 6, type: 'Jazz' }, charged: { name: 'Solo', power: 30, type: 'Jazz', energy: 45 } },
  Classical: { fast: { name: 'Phrase', power: 5, type: 'Classical' }, charged: { name: 'Crescendo', power: 28, type: 'Classical', energy: 40 } },
  Indie: { fast: { name: 'Strum', power: 7, type: 'Indie' }, charged: { name: 'Bridge', power: 32, type: 'Indie', energy: 50 } },
  'R&B': { fast: { name: 'Groove', power: 8, type: 'R&B' }, charged: { name: 'Run', power: 38, type: 'R&B', energy: 55 } },
  Latin: { fast: { name: 'Clave', power: 9, type: 'Latin' }, charged: { name: 'Salsa', power: 42, type: 'Latin', energy: 60 } },
  'K-Pop': { fast: { name: 'Choreo', power: 9, type: 'K-Pop' }, charged: { name: 'Comeback', power: 48, type: 'K-Pop', energy: 65 } },
}
const t = (id, title, artist, album, genre, rarity, energy, dance, tempo, catchRate, evolvesTo = null, candyCost = 0) => ({
  id, title, artist, album, genre, rarity, evolvesTo, candyCost,
  type: genre,
  moves: MOVES[genre],
  stats: { energy, dance, tempo, catchRate: catchRate ?? RARITY[rarity].catchBase, cp: energy * 10 + dance * 5 + tempo, hp: 50 + energy },
  xp: RARITY[rarity].xp,
  candyReward: RARITY[rarity].xp,
  buddyCandyPerKm: 1 + (RARITY[rarity].xp > 100 ? 1 : 0),
  hue: (id * 47 + genre.length * 13) % 360,
})

export const TRACKS = [
  t(1, 'Midnight Pulse', 'Nova Ray', 'Neon Nights', 'Electronic', 'common', 82, 78, 128, 0.9),
  t(2, 'City Lights', 'Aria Voss', 'Afterglow', 'Pop', 'common', 70, 85, 120, 0.88),
  t(3, 'Concrete Jungle', 'MC Flow', 'Streets', 'Hip-Hop', 'common', 75, 60, 95, 0.85),
  t(4, 'Static Dreams', 'The Voltz', 'Amplify', 'Rock', 'common', 88, 55, 140, 0.8),
  t(5, 'Blue Note', 'Miles & Co', 'Smoke & Brass', 'Jazz', 'uncommon', 45, 40, 90, 0.6),
  t(6, 'Moonlight Sonata (Remix)', 'L. Beethoven', 'Classics Reborn', 'Classical', 'rare', 30, 20, 72, 0.4),
  t(7, 'Paper Planes', 'Indie Folk', 'Lo-Fi Mornings', 'Indie', 'common', 50, 55, 100, 0.85),
  t(8, 'Slow Burn', 'Velvet Rose', 'Velvet', 'R&B', 'uncommon', 40, 70, 85, 0.62),
  t(9, 'Fiesta Caliente', 'Los Ritmos', 'Carnaval', 'Latin', 'common', 80, 92, 132, 0.82),
  t(10, 'Starlight', 'NEON7', 'K-Wave', 'K-Pop', 'uncommon', 85, 90, 124, 0.6),
  t(11, 'Deep Ocean', 'Abyss', 'Depths', 'Electronic', 'rare', 60, 65, 110, 0.42),
  t(12, 'Golden Hour', 'Sunset Drive', 'West Coast', 'Pop', 'uncommon', 65, 75, 118, 0.6),
  t(13, 'Riot', 'Broken Glass', 'Shatter', 'Rock', 'rare', 95, 50, 150, 0.38),
  t(14, 'Freestyle Friday', 'DJ Cipher', 'Mixtape Vol.1', 'Hip-Hop', 'uncommon', 78, 68, 98, 0.58),
  t(15, 'Smoky Room', 'Jazz Cats', 'After Hours', 'Jazz', 'rare', 35, 30, 80, 0.4),
  t(16, 'Requiem', 'Orchestra Nova', 'Eternal', 'Classical', 'epic', 25, 15, 60, 0.22),
  t(17, 'Wanderlust', 'The Drifters', 'Roads', 'Indie', 'uncommon', 55, 60, 105, 0.6),
  t(18, 'Midnight Kiss', 'Sable', 'After Dark', 'R&B', 'rare', 45, 78, 88, 0.4),
  t(19, 'Baila', 'Carmen Sol', 'Pasión', 'Latin', 'uncommon', 75, 95, 138, 0.58),
  t(20, 'Catch Me', 'IDOL-X', 'Stage', 'K-Pop', 'rare', 90, 92, 126, 0.38),
  t(21, 'Aurora', 'Lumina', 'Skyline', 'Electronic', 'epic', 70, 80, 122, 0.2),
  t(22, 'Echoes', 'Hollow', 'Void', 'Rock', 'epic', 92, 48, 145, 0.18),
  t(23, 'Crown', 'Kingpin', 'Throne', 'Hip-Hop', 'epic', 85, 70, 100, 0.2),
  t(24, 'Symphony No.9', 'Maestro', 'Masterworks', 'Classical', 'legendary', 40, 25, 70, 0.1),
  t(25, 'Neon Tokyo', 'Vapor', 'City Pop', 'Electronic', 'legendary', 88, 85, 128, 0.1),
  t(26, 'Heartbeat', 'Pulse', 'Alive', 'Pop', 'legendary', 95, 90, 130, 0.1),
  t(27, 'Underground', 'Cipher', 'Beneath', 'Hip-Hop', 'rare', 72, 62, 96, 0.4),
  t(28, 'Electric Feel', 'Synthwave', 'Retro', 'Electronic', 'uncommon', 78, 72, 124, 0.58),
  t(29, 'Acoustic Rain', 'Willow', 'Forest', 'Indie', 'common', 40, 45, 92, 0.85),
  t(30, 'Soul Fire', 'Ember', 'Heat', 'R&B', 'epic', 60, 82, 90, 0.2),
  t(31, 'Carnival', 'Brass Band', 'Parade', 'Latin', 'rare', 85, 90, 136, 0.4),
  t(32, 'Debut', 'Rookie', 'First Step', 'K-Pop', 'common', 75, 80, 120, 0.85),
  t(33, 'Lofi Study', 'Chill Beats', 'Focus', 'Indie', 'common', 30, 35, 80, 0.9),
  t(34, 'Anthem', 'United', 'Together', 'Rock', 'legendary', 98, 60, 155, 0.08),
  t(35, 'Smooth Operator', 'Velvet', 'Late Night', 'Jazz', 'epic', 40, 50, 85, 0.2),
  t(36, 'Tango', 'Buenos Aires', 'Dance', 'Latin', 'epic', 70, 95, 130, 0.2),
  t(37, 'Galaxy', 'Cosmos', 'Universe', 'Electronic', 'rare', 65, 70, 115, 0.4),
  t(38, 'Ballad', 'Crooner', 'Love Songs', 'Pop', 'common', 35, 40, 75, 0.88),
  t(39, 'Drumline', 'Percussion', 'Beat', 'Rock', 'uncommon', 90, 55, 140, 0.55),
  t(40, 'Whisper', 'Silent', 'Quiet', 'Indie', 'rare', 25, 30, 70, 0.4),
  t(41, 'Bass Drop', 'Subwoofer', 'Low End', 'Electronic', 'uncommon', 85, 75, 128, 0.58),
  t(42, 'Rhyme Scheme', 'Lyricist', 'Bars', 'Hip-Hop', 'common', 70, 65, 95, 0.85),
  t(43, 'Serenade', 'Strings', 'Romance', 'Classical', 'uncommon', 30, 25, 65, 0.55),
  t(44, 'Funk It', 'Groove', 'Funkadelic', 'R&B', 'rare', 75, 88, 110, 0.4),
  t(45, 'K-Wave Anthem', 'IDOL-Y', 'Debut', 'K-Pop', 'epic', 92, 95, 132, 0.2),
]

export function getTrack(id) { return TRACKS.find(t => t.id === id) }

export const TRACK_BY_ID = Object.fromEntries(TRACKS.map(t => [t.id, t]))
