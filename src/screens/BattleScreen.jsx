import { useState } from 'react'
import { useStore } from '../store/gameStore'
import { TRACKS } from '../data/tracks'


function makeHp(track) { return 80 + track.stats.energy }

export default function BattleScreen() {
  const collection = useStore(s => s.collection) || {}
  const battle = useStore(s => s.battle)
  const setBattle = useStore(s => s.setBattle)

  const [team, setTeam] = useState([])
  const [phase, setPhase] = useState('select') // select | fighting | result
  const [result, setResult] = useState(null)

  const caughtIds = Object.keys(collection).map(Number)

  const startFight = () => {
    if (team.length === 0) return
    // enemy team: random tracks, scaled to player level
    const enemyTeam = []
    const n = Math.min(3, Math.max(1, team.length))
    for (let i = 0; i < n; i++) {
      const t = TRACKS[Math.floor(Math.random() * TRACKS.length)]
      if (!enemyTeam.find(e => e.id === t.id)) enemyTeam.push(t)
    }
    if (enemyTeam.length === 0) enemyTeam.push(TRACKS[0])
    // init battle
    const playerHp = {}
    const enemyHp = {}
    team.forEach(t => { playerHp[t.id] = makeHp(t) })
    enemyTeam.forEach(t => { enemyHp[t.id] = makeHp(t) })
    setBattle({
      playerTeam: team.map(t => t.id),
      enemyTeam: enemyTeam.map(t => t.id),
      playerHp, enemyHp,
      playerActive: team[0].id,
      enemyActive: enemyTeam[0].id,
      turn: 'player',
      log: ['Battle start!'],
      status: 'active',
    })
    setPhase('fighting')
  }

  const battleState = battle

  const doAttack = (move) => {
    if (!battleState || battleState.turn !== 'player' || battleState.status !== 'active') return
    const atk = TRACKS.find(t => t.id === battleState.playerActive)
    const def = TRACKS.find(t => t.id === battleState.enemyActive)
    const pHp = { ...battleState.playerHp }
    const eHp = { ...battleState.enemyHp }
    const log = [...battleState.log]

    // player attack
    let dmg = Math.round((atk.stats.energy + atk.stats.dance) / 4 + Math.random() * 15)
    if (move === 'special') dmg = Math.round(dmg * 1.6)
    if (move === 'heal') {
      pHp[atk.id] = Math.min(makeHp(atk), pHp[atk.id] + 30)
      log.push(`${atk.title} healed 30 HP!`)
    } else {
      eHp[def.id] = Math.max(0, eHp[def.id] - dmg)
      log.push(`${atk.title} used ${move === 'special' ? 'Ultimate' : 'Attack'} on ${def.title} for ${dmg} dmg!`)
    }

    // check enemy faint
    let nextEnemyActive = battleState.enemyActive
    if (eHp[def.id] <= 0) {
      log.push(`${def.title} fainted!`)
      const remaining = battleState.enemyTeam.filter(id => eHp[id] > 0)
      if (remaining.length === 0) {
        // win
        useStore.getState().endBattle('win')
        setResult('win')
        setPhase('result')
        return
      }
      nextEnemyActive = remaining[0]
    }

    // enemy turn
    setTimeout(() => {
      const bs = useStore.getState().battle
      if (!bs || bs.status !== 'active') return
      const eAtk = TRACKS.find(t => t.id === bs.enemyActive)
      const pDef = TRACKS.find(t => t.id === bs.playerActive)
      const pHp2 = { ...bs.playerHp }
      const eHp2 = { ...bs.enemyHp }
      const log2 = [...bs.log]
      const eDmg = Math.round((eAtk.stats.energy + eAtk.stats.dance) / 4 + Math.random() * 12)
      pHp2[pDef.id] = Math.max(0, pHp2[pDef.id] - eDmg)
      log2.push(`${eAtk.title} attacked ${pDef.title} for ${eDmg} dmg!`)

      let nextPlayerActive = bs.playerActive
      if (pHp2[pDef.id] <= 0) {
        log2.push(`${pDef.title} fainted!`)
        const remaining = bs.playerTeam.filter(id => pHp2[id] > 0)
        if (remaining.length === 0) {
          useStore.getState().endBattle('lose')
          setResult('lose')
          setPhase('result')
          return
        }
        nextPlayerActive = remaining[0]
      }
      setBattle({ ...bs, playerHp: pHp2, enemyHp: eHp2, playerActive: nextPlayerActive, enemyActive: nextEnemyActive, turn: 'player', log: log2, status: 'active' })
    }, 700)

    setBattle({ ...battleState, playerHp: pHp, enemyHp: eHp, enemyActive: nextEnemyActive, turn: 'enemy', log })
  }

  const reset = () => {
    setTeam([])
    setEnemy(null)
    setResult(null)
    setPhase('select')
    useStore.getState().setBattle(null)
  }

  if (phase === 'select') {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">Battle Arena</h1>
        <p className="text-sm text-slate-400">Pick up to 3 caught tracks for your team.</p>
        {caughtIds.length === 0 && (
          <div className="glass rounded-2xl p-6 text-center text-slate-400">Catch some tracks first!</div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {caughtIds.map(id => {
            const t = TRACKS.find(x => x.id === id)
            const sel = team.find(x => x.id === id)
            return (
              <button key={id} onClick={() => {
                if (sel) setTeam(team.filter(x => x.id !== id))
                else if (team.length < 3) setTeam([...team, t])
              }} className={`glass rounded-xl p-2 text-center ${sel ? 'ring-2 ring-fuchsia-500' : ''}`}>
                <div className="w-full aspect-square rounded-lg flex items-center justify-center text-xl mb-1" style={{ background: `linear-gradient(135deg, hsl(${t.hue},70%,45%), hsl(${(t.hue+60)%360},70%,30%))` }}>🎵</div>
                <div className="text-[10px] font-semibold truncate">{t.title}</div>
              </button>
            )
          })}
        </div>
        <button onClick={startFight} disabled={team.length === 0} className="w-full py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 font-bold disabled:opacity-40">
          Start Battle ({team.length}/3)
        </button>
      </div>
    )
  }

  if (phase === 'fighting' && battleState) {
    const playerActive = TRACKS.find(t => t.id === battleState.playerActive)
    const enemyActive = TRACKS.find(t => t.id === battleState.enemyActive)
    const pHp = battleState.playerHp[playerActive.id]
    const eHp = battleState.enemyHp[enemyActive.id]
    const pHpMax = makeHp(playerActive)
    const eHpMax = makeHp(enemyActive)
    return (
      <div className="p-4 space-y-3">
        {/* enemy */}
        <div className="glass rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Enemy</span>
            <span className="text-xs font-semibold">{enemyActive.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl" style={{ background: `linear-gradient(135deg, hsl(${enemyActive.hue},70%,45%), hsl(${(enemyActive.hue+60)%360},70%,30%))` }}>🎵</div>
            <div className="flex-1">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 transition-all" style={{ width: `${(eHp / eHpMax) * 100}%` }} />
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{eHp}/{eHpMax} HP</div>
            </div>
          </div>
        </div>

        {/* player */}
        <div className="glass rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">You</span>
            <span className="text-xs font-semibold">{playerActive.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl" style={{ background: `linear-gradient(135deg, hsl(${playerActive.hue},70%,45%), hsl(${(playerActive.hue+60)%360},70%,30%))` }}>🎵</div>
            <div className="flex-1">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${(pHp / pHpMax) * 100}%` }} />
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{pHp}/{pHpMax} HP</div>
            </div>
          </div>
        </div>

        {/* log */}
        <div className="glass rounded-2xl p-3 max-h-28 overflow-y-auto no-scrollbar text-xs text-slate-300 space-y-1">
          {battleState.log.slice(-6).map((l, i) => <div key={i}>{l}</div>)}
        </div>

        {/* actions */}
        <div className="grid grid-cols-3 gap-2">
          <button disabled={battleState.turn !== 'player'} onClick={() => doAttack('attack')} className="py-3 rounded-2xl bg-slate-800 font-semibold text-sm disabled:opacity-40">Attack</button>
          <button disabled={battleState.turn !== 'player'} onClick={() => doAttack('special')} className="py-3 rounded-2xl bg-fuchsia-600 font-semibold text-sm disabled:opacity-40">Ultimate</button>
          <button disabled={battleState.turn !== 'player'} onClick={() => doAttack('heal')} className="py-3 rounded-2xl bg-green-600 font-semibold text-sm disabled:opacity-40">Heal</button>
        </div>
        {battleState.turn === 'enemy' && <p className="text-center text-xs text-slate-400">Enemy thinking...</p>}
      </div>
    )
  }

  if (phase === 'result') {
    const win = result === 'win'
    return (
      <div className="p-4 text-center space-y-4">
        <div className="text-6xl">{win ? '🏆' : '💔'}</div>
        <h2 className="text-2xl font-bold">{win ? 'Victory!' : 'Defeat'}</h2>
        <p className="text-slate-400">{win ? 'You earned 100 XP and 200 coins.' : 'Better luck next time.'}</p>
        <button onClick={reset} className="w-full py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 font-bold">Play Again</button>
      </div>
    )
  }

  return null
}
