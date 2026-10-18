// Fast & charged move pools per genre (the "type"). power/energy tune battle pacing.
export const MOVES = {
  Pop: {
    fast: [
      { id: 'chorus', name: 'Chorus', power: 7, energy: 8, dur: 0.7 },
      { id: 'hook', name: 'Hook', power: 11, energy: 10, dur: 1.1 },
    ],
    charged: [
      { id: 'anthem', name: 'Anthem', power: 55, energy: 50 },
      { id: 'encore', name: 'Encore Blast', power: 80, energy: 75 },
    ],
  },
  'Hip-Hop': {
    fast: [
      { id: 'flow', name: 'Flow', power: 8, energy: 9, dur: 0.8 },
      { id: 'bars', name: 'Bars', power: 12, energy: 11, dur: 1.2 },
    ],
    charged: [
      { id: 'versedrop', name: 'Verse Drop', power: 60, energy: 55 },
      { id: 'micdrop', name: 'Mic Drop', power: 90, energy: 90 },
    ],
  },
  Rock: {
    fast: [
      { id: 'riff', name: 'Riff', power: 9, energy: 8, dur: 0.8 },
      { id: 'strum', name: 'Power Strum', power: 12, energy: 10, dur: 1.2 },
    ],
    charged: [
      { id: 'solo', name: 'Guitar Solo', power: 58, energy: 55 },
      { id: 'wallop', name: 'Wall of Sound', power: 85, energy: 80 },
    ],
  },
  Electronic: {
    fast: [
      { id: 'beat', name: 'Beat', power: 7, energy: 9, dur: 0.6 },
      { id: 'arp', name: 'Arp', power: 10, energy: 10, dur: 1.0 },
    ],
    charged: [
      { id: 'drop', name: 'Bass Drop', power: 60, energy: 55 },
      { id: 'synthwave', name: 'Synthwave Surge', power: 88, energy: 85 },
    ],
  },
  Jazz: {
    fast: [
      { id: 'improv', name: 'Improv', power: 6, energy: 8, dur: 0.6 },
      { id: 'brush', name: 'Brush Work', power: 9, energy: 10, dur: 1.0 },
    ],
    charged: [
      { id: 'jsolo', name: 'Solo Break', power: 50, energy: 45 },
      { id: 'blue', name: 'Blue Notes', power: 75, energy: 70 },
    ],
  },
  Classical: {
    fast: [
      { id: 'phrase', name: 'Phrase', power: 5, energy: 8, dur: 0.6 },
      { id: 'scale', name: 'Scales', power: 9, energy: 10, dur: 1.0 },
    ],
    charged: [
      { id: 'crescendo', name: 'Crescendo', power: 52, energy: 45 },
      { id: 'finale', name: 'Grand Finale', power: 82, energy: 80 },
    ],
  },
  Indie: {
    fast: [
      { id: 'strum2', name: 'Strum', power: 7, energy: 8, dur: 0.7 },
      { id: 'hum', name: 'Hum', power: 10, energy: 10, dur: 1.1 },
    ],
    charged: [
      { id: 'bridge', name: 'Bridge', power: 48, energy: 45 },
      { id: 'reverb', name: 'Reverb Rush', power: 72, energy: 70 },
    ],
  },
  'R&B': {
    fast: [
      { id: 'groove', name: 'Groove', power: 8, energy: 8, dur: 0.7 },
      { id: 'run', name: 'Runs', power: 11, energy: 11, dur: 1.2 },
    ],
    charged: [
      { id: 'falsetto', name: 'Falsetto', power: 56, energy: 50 },
      { id: 'slowjam', name: 'Slow Jam', power: 84, energy: 80 },
    ],
  },
  Latin: {
    fast: [
      { id: 'clave', name: 'Clave', power: 8, energy: 8, dur: 0.7 },
      { id: 'tumbao', name: 'Tumbao', power: 11, energy: 10, dur: 1.1 },
    ],
    charged: [
      { id: 'salsa', name: 'Salsa', power: 58, energy: 50 },
      { id: 'carnaval', name: 'Carnaval', power: 86, energy: 85 },
    ],
  },
  'K-Pop': {
    fast: [
      { id: 'choreo', name: 'Choreo', power: 8, energy: 9, dur: 0.8 },
      { id: 'point', name: 'Point Dance', power: 12, energy: 12, dur: 1.3 },
    ],
    charged: [
      { id: 'comeback', name: 'Comeback', power: 60, energy: 55 },
      { id: 'finale-k', name: 'Finale', power: 92, energy: 90 },
    ],
  },
}

export function fastMoves(genre) { return MOVES[genre]?.fast || MOVES.Pop.fast }
export function chargedMoves(genre) { return MOVES[genre]?.charged || MOVES.Pop.charged }
