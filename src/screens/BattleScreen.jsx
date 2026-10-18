import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/gameStore'
import { TRACKS, TRACK_BY_ID } from '../data/tracks'
import { effectiveness, LEAGUES } from '../data/types'
import { fastMoves, chargedMoves } from '../data/moves'
import { TRAINERS, ROCKET_GRUNTS, ROCKET_LEADERS, ROCKET_BOSS, SHADOW_POOL } from '../data/npcs'
import { makeSpawn } from '../utils/geo'
import TrackArt from '../components/TrackArt'
import { Swords, Shield, Zap, HeartPulse } from 'lucide-react'

const dmgCalc = (cp, power, eff) => Math.max(3, Math.round((cp / 16) * (power / 8) * eff * (0.85 + Math.random() * 0.3)))

export default function BattleScreen() {
  const store = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const instances = useMemo(() => Object.values(store.collection || {}).filter(i => i.hp > 0 || true), [store.collection])
  const [mode, setMode] = useState(params.get('mode') || 'trainer') // trainer|league|gym|raid|rocket|max
  const [league, setLeague] = useState(LEAGUES[0])
  const [party, setParty] = useState([])
  const [target, setTarget] = useState(null) // {kind, name, avatar, team:[trackIds], bossOpts}
  const [phase, setPhase] = useState('hub') // hub|party|fight|result
  const [B, setB] = useState(null)
  const [result, setResult] = useState(null)
  const [mini, setMini] = useState(null) // {taps, move}
  const [note, setNote] = useState(null)
  const timerRef = useRef(null)
  const say = (t) => { setNote(t); setTimeout(() => setNote(null), 3000) }

  // generate raids if none
  useEffect(() => {
    if ((store.raids || []).length === 0) {
      const gyms = (store.pois || []).filter(p => p.kind === 'gym')
      const bosses = TRACKS.filter(t => ['epic', 'legendary', 'rare'].includes(t.rarity))
      const raids = []
      for (let i = 0; i < 4; i++) {
        const boss = bosses[Math.floor(Math.random() * bosses.length)]
        const type = ['standard', 'standard', 'shadow', 'max'][i]
        raids.push({ id: `raid-${i}-${Date.now()}`, bossId: boss.id, poiId: gyms[i % Math.max(1, gyms.length)]?.id || null, poiName: gyms[i % Math.max(1, gyms.length)]?.name || 'The Grand Stage', tier: type === 'max' ? 'MAX' : type === 'shadow' ? 'Shadow 3★' : boss.rarity === 'legendary' ? '5★' : '3★', type, expires: Date.now() + 3600000 })
      }
      store.setRaids(raids)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.pois?.length])

  useEffect(() => {
    const m = params.get('mode'); if (!m) return
    setMode(m)
    if (m === 'raid') { const r = (store.raids || []).find(x => x.id === params.get('raidId')); if (r) pickTarget({ kind: 'raid', name: `${r.tier} Raid`, avatar: '🥚', team: [r.bossId], raid: r }) }
    if (m === 'gym') { const poi = (store.pois || []).find(p => p.id === params.get('poiId')); if (poi) pickTarget({ kind: 'gym', name: poi.name, avatar: '🏟️', team: [13, 20, 39], poi }) }
    if (m === 'rocket') { const who = params.get('who') || 'grunt'; const npc = who === 'boss' ? ROCKET_BOSS : who === 'leader' ? ROCKET_LEADERS[0] : ROCKET_GRUNTS[0]; pickTarget({ kind: 'rocket', ...npc }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get('mode'), params.get('raidId')])

  const pickTarget = (t) => { setTarget(t); setPhase('party'); setParty([]) }

  const startFight = () => {
    if (!party.length || !target) return
    const scale = target.kind === 'raid' ? (target.raid?.type === 'max' ? 9 : 5) : target.kind === 'max' ? 9 : target.kind === 'rocket' ? 1.6 : target.kind === 'gym' ? 1.4 : 1.1
    const enemies = target.team.map((tid, i) => {
      const t = TRACK_BY_ID[tid]; const maxHp = Math.round((90 + t.sta) * scale * (1 + i * 0.08))
      return { trackId: tid, name: t.title, maxHp, hp: maxHp, cp: Math.round(t.atk * 10 * Math.min(scale, 2.2)), energy: 0, genre: t.genre }
    })
    const playerHp = {}; party.forEach(uid => { const inst = store.collection[uid]; playerHp[uid] = Math.max(1, inst.hp) })
    setB({ enemies, ei: 0, party: [...party], pi: 0, playerHp, energy: 0, shields: 2, eShields: target.kind === 'trainer' || target.kind === 'league' || target.kind === 'rocket' ? 2 : 0, shieldArmed: false, log: [`Battle vs ${target.name}!`], busy: false, timeLeft: target.kind === 'raid' || target.kind === 'max' ? 120 : null })
    setPhase('fight')
  }

  useEffect(() => {
    if (phase !== 'fight' || !B?.timeLeft) return
    timerRef.current = setInterval(() => setB(b => (b ? { ...b, timeLeft: b.timeLeft - 1 } : b)), 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, !!B])

  useEffect(() => { if (B && B.timeLeft === 0 && phase === 'fight') finish(false, 'Time up! The boss endured.') }, [B?.timeLeft]) // eslint-disable-line

  const activeInst = B ? store.collection[B.party[B.pi]] : null
  const activeTrack = activeInst ? TRACK_BY_ID[activeInst.trackId] : null
  const enemy = B?.enemies[B.ei]

  const finish = (win, why = '') => {
    if (!B) return
    Object.entries(B.playerHp).forEach(([u, hp]) => store.setInstanceHp(u, hp))
    const kind = target.kind
    if (kind === 'league') { store.recordLeague(win); store.recordBattle({ win, kind: 'trainer' }) }
    else store.recordBattle({ win, kind: kind === 'gym' ? 'gym' : kind === 'raid' || kind === 'max' ? 'raid' : kind === 'rocket' ? 'rocket' : 'trainer' })
    if (win && kind === 'gym' && target.poi) {
      store.updatePoi(target.poi.id, { gym: { team: store.profile.team || 'valor', owner: store.profile.name, defenders: [], points: 500, level: 1 }, badge: { visits: 1, battles: 1 } })
      const coins = store.claimGymCoins(target.poi.id); if (coins) say(`Gym claimed! +${coins} defender coins`)
    }
    if (win && store.buddy) store.addBuddyHearts(1, 'battle')
    setResult({ win, why }); setPhase('result')
  }

  const enemyTurn = (nb) => {
    const e = nb.enemies[nb.ei]; const pTrack = TRACK_BY_ID[store.collection[nb.party[nb.pi]].trackId]
    const eTrack = TRACK_BY_ID[e.trackId]
    const log = [...nb.log]
    let { playerHp, shields, shieldArmed } = nb
    const useCharged = e.energy >= 50 && Math.random() < 0.6
    const move = useCharged ? chargedMoves(eTrack.genre)[0] : fastMoves(eTrack.genre)[0]
    let dmg = dmgCalc(e.cp, move.power, effectiveness(eTrack.genre, pTrack.genre))
    if (useCharged) {
      e.energy = 0
      if (shieldArmed && shields > 0) { shields--; shieldArmed = false; dmg = 0; log.push(`🛡️ Shield blocked ${move.name}!`) }
      else log.push(`${e.name} used ${move.name}!`)
    } else { e.energy = Math.min(100, e.energy + 10); log.push(`${e.name} used ${move.name} (${dmg})`) }
    const uid = nb.party[nb.pi]
    playerHp = { ...playerHp, [uid]: Math.max(0, playerHp[uid] - dmg) }
    let pi = nb.pi
    if (playerHp[uid] <= 0) {
      log.push(`${pTrack.title} fainted!`)
      const next = nb.party.findIndex((u, idx) => playerHp[u] > 0)
      if (next === -1) { setB({ ...nb, playerHp, shields, shieldArmed, log, busy: false }); setTimeout(() => finish(false), 400); return }
      pi = next; log.push(`Go, ${TRACK_BY_ID[store.collection[nb.party[pi]].trackId].title}!`)
    }
    setB({ ...nb, playerHp, shields, shieldArmed, pi, log: log.slice(-7), busy: false })
  }

  const playerAttack = (kind) => {
    if (!B || B.busy || phase !== 'fight') return
    const inst = activeInst, t = activeTrack, e = enemy
    const eff = effectiveness(t.genre, TRACK_BY_ID[e.trackId].genre)
    if (kind === 'charged') {
      const moves = chargedMoves(t.genre); const move = moves[0]
      if (B.energy < move.energy) return
      setMini({ taps: 0, move }); return
    }
    const move = fastMoves(t.genre)[0]
    const dmg = dmgCalc(inst.cp, move.power, eff)
    const enemies = B.enemies.map((x, i) => i === B.ei ? { ...x, hp: Math.max(0, x.hp - dmg) } : x)
    const log = [...B.log, `${t.title} used ${move.name} (${dmg}${eff > 1 ? ', super effective!' : eff < 1 ? ', not very effective' : ''})`]
    const nb = { ...B, enemies, energy: Math.min(100, B.energy + move.energy + 6), log: log.slice(-7), busy: true }
    afterPlayerHit(nb)
  }

  const resolveCharged = () => {
    if (!mini || !B) return
    const inst = activeInst, t = activeTrack, e = enemy
    const mult = 0.4 + Math.min(0.6, (mini.taps / 18) * 0.6)
    let dmg = Math.round(dmgCalc(inst.cp, mini.move.power, effectiveness(t.genre, TRACK_BY_ID[e.trackId].genre)) * mult)
    const log = [...B.log]
    let eShields = B.eShields
    if (eShields > 0 && Math.random() < 0.5) { eShields--; dmg = 0; log.push(`🛡️ Enemy shield blocked ${mini.move.name}!`) }
    else log.push(`${t.title} used ${mini.move.name} — mini-game ×${mult.toFixed(2)} (${dmg})`)
    const enemies = B.enemies.map((x, i) => i === B.ei ? { ...x, hp: Math.max(0, x.hp - dmg) } : x)
    setMini(null)
    afterPlayerHit({ ...B, enemies, eShields, energy: B.energy - mini.move.energy, log: log.slice(-7), busy: true })
  }

  const afterPlayerHit = (nb) => {
    if (nb.enemies[nb.ei].hp <= 0) {
      nb.log = [...nb.log, `${nb.enemies[nb.ei].name} fainted!`]
      const next = nb.enemies.findIndex(x => x.hp > 0)
      if (next === -1) { setB(nb); setTimeout(() => onWin(), 500); return }
      setB({ ...nb, ei: next, busy: false }); return
    }
    setB(nb); setTimeout(() => enemyTurn(nb), 650)
  }

  const onWin = () => {
    const kind = target.kind
    if (kind === 'raid' || kind === 'max') {
      const raid = target.raid; const bossId = target.team[0]
      if (raid) store.removeRaid(raid.id)
      if (kind === 'max') {
        const inst = store.grantTrack(bossId, { source: 'max', form: 'Gigantamax' }); store.addItem('ultra', 3); store.addStardust(1000)
        finish(true, `You caught the Gigantamax ${TRACK_BY_ID[bossId].title}!`)
      } else {
        store.addItem('ultra', 2); store.addItem(raid.type === 'shadow' ? 'golden' : 'razz', 1); store.addCoins(300); store.addStardust(750)
        const c = makeSpawn({ lat: 43.4516, lng: -80.4925 }, bossId, 'raid'); c.shadow = raid.type === 'shadow'
        store.addSpawn(c); finish(true, 'Raid won! Catch the boss!')
        setTimeout(() => navigate(`/encounter/${c.id}`), 900)
      }
      return
    }
    if (kind === 'rocket') {
      const bossId = SHADOW_POOL[Math.floor(Math.random() * SHADOW_POOL.length)]
      const c = makeSpawn({ lat: 43.4516, lng: -80.4925 }, bossId, 'rocket'); c.shadow = true
      store.addSpawn(c); store.addStardust(500)
      finish(true, 'Team Static defeated! Rescue the Shadow track!')
      setTimeout(() => navigate(`/encounter/${c.id}`), 900); return
    }
    finish(true)
  }

  const switchTo = (idx) => { if (!B || B.busy || B.playerHp[B.party[idx]] <= 0 || idx === B.pi) return; setB({ ...B, pi: idx, log: [...B.log, `Switched to ${TRACK_BY_ID[store.collection[B.party[idx]].trackId].title}`].slice(-7) }) }

  // ---------- views ----------
  if (phase === 'hub') return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold flex items-center gap-2"><Swords size={20} /> Battle</h1>
      {note && <div className="glass rounded-xl px-3 py-2 text-xs text-emerald-300">{note}</div>}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {[['trainer', '🧑 Trainers'], ['league', '🏆 GO Battle League'], ['gym', '🏟️ Gyms'], ['raid', '🥚 Raids'], ['rocket', '🚨 Team Static'], ['max', '🌌 Max Battles']].map(([id, l]) => <button key={id} onClick={() => setMode(id)} className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold ${mode === id ? 'bg-fuchsia-500' : 'bg-slate-800'}`}>{l}</button>)}
      </div>

      {mode === 'trainer' && <Section title="Trainer Battles">{TRAINERS.map(t => <Row key={t.name} avatar={t.avatar} title={t.name} sub={`Lv ${t.level} · ${t.team.map(id => TRACK_BY_ID[id].title).join(', ')}`} btn="Battle" onClick={() => pickTarget({ kind: 'trainer', ...t })} />)}</Section>}
      {mode === 'league' && (
        <div className="space-y-3">
          <div className="glass rounded-2xl p-3 text-sm">Rating <b className="text-amber-300">{store.league.rating}</b> · Wins {store.league.wins}/{store.league.battles} · Sets of 5, shields ×2, CP caps apply</div>
          {LEAGUES.map(l => <button key={l.id} onClick={() => { setLeague(l); pickTarget({ kind: 'league', name: `${l.name} rival`, avatar: l.icon, team: [10, 21, 45] }) }} className="w-full glass rounded-2xl p-3 text-left"><span className="font-bold">{l.icon} {l.name}</span><span className="block text-[11px] text-slate-400">CP cap {l.cap > 9000 ? 'none' : l.cap} · Find match</span></button>)}
        </div>
      )}
      {mode === 'gym' && <Section title="Venue Gyms (from map)">{(store.pois || []).filter(p => p.kind === 'gym').slice(0, 6).map(p => <Row key={p.id} avatar="🏟️" title={p.name} sub={p.gym?.team ? `Held by ${p.gym.team} · ${p.gym.defenders?.length || 0} defenders · ${p.gym.points || 0} pts` : 'Unclaimed — win to claim!'} btn="Visit" onClick={() => navigate(`/gym/${p.id}`)} />)}{(store.pois || []).length === 0 && <p className="text-xs text-slate-400">Visit the map first to discover gyms.</p>}</Section>}
      {mode === 'raid' && <Section title="Raid Battles — win, then catch the boss">{(store.raids || []).map(r => { const b = TRACK_BY_ID[r.bossId]; return <Row key={r.id} avatar={r.type === 'max' ? '🌌' : r.type === 'shadow' ? '🌑' : '🥚'} title={`${b?.title} — ${r.tier}${r.type !== 'standard' ? ` ${r.type}` : ''}`} sub={`${r.poiName} · uses 1 Raid Pass`} btn="Raid" onClick={() => { if (!store.consumeItem('raidpass') && !store.consumeItem('premiumpass')) { say('Need a Raid Pass (shop/stops)'); return } pickTarget({ kind: 'raid', name: `${r.tier} Raid`, avatar: '🥚', team: [r.bossId], raid: r }) }} /> })}</Section>}
      {mode === 'rocket' && <Section title="Team Static — rescue Shadow tracks">
        {ROCKET_GRUNTS.map(t => <Row key={t.name} avatar={t.avatar} title={t.name} sub={`Grunt · Lv ${t.level}`} btn="Battle" onClick={() => pickTarget({ kind: 'rocket', ...t })} />)}
        {ROCKET_LEADERS.map(t => <Row key={t.name} avatar={t.avatar} title={`Leader ${t.name}`} sub={`Lv ${t.level} · bigger rewards`} btn="Battle" onClick={() => pickTarget({ kind: 'rocket', ...t })} />)}
        <Row avatar={ROCKET_BOSS.avatar} title={`Boss: ${ROCKET_BOSS.name}`} sub={`Lv ${ROCKET_BOSS.level} · final showdown`} btn="Battle" onClick={() => pickTarget({ kind: 'rocket', ...ROCKET_BOSS })} />
      </Section>}
      {mode === 'max' && <Section title="Max Battles — Dynamax & Gigantamax">{TRACKS.filter(t => ['epic', 'legendary'].includes(t.rarity)).slice(0, 5).map(t => <Row key={t.id} avatar="🌌" title={`Gigantamax ${t.title}`} sub="1-track party · huge HP boss" btn="Max Battle" onClick={() => pickTarget({ kind: 'max', name: `Gigantamax ${t.title}`, avatar: '🌌', team: [t.id] })} />)}</Section>}
    </div>
  )

  if (phase === 'party') return (
    <div className="p-4 space-y-4">
      <button onClick={() => setPhase('hub')} className="text-slate-400 text-sm">← Back</button>
      <h1 className="text-lg font-bold">{target?.avatar} {target?.name}</h1>
      <p className="text-xs text-slate-400">Pick {mode === 'max' || target?.kind === 'max' ? 1 : 'up to 3'} tracks. Fainted tracks need a Revive. {target?.kind === 'league' ? `League CP cap: ${league.cap > 9000 ? 'none' : league.cap}` : ''}</p>
      <div className="grid grid-cols-3 gap-2">
        {instances.map(inst => { const t = TRACK_BY_ID[inst.trackId]; const sel = party.includes(inst.uid); const over = target?.kind === 'league' && league.cap < 9000 && inst.cp > league.cap; return (
          <button key={inst.uid} disabled={inst.hp <= 0} onClick={() => { if (sel) setParty(party.filter(u => u !== inst.uid)); else if (party.length < (target?.kind === 'max' ? 1 : 3)) setParty([...party, inst.uid]) }} className={`glass rounded-xl p-2 text-center ${sel ? 'ring-2 ring-fuchsia-500' : ''} ${inst.hp <= 0 ? 'opacity-40' : ''} ${over ? 'ring-1 ring-amber-500' : ''}`}>
            <div className="flex justify-center"><TrackArt track={t} inst={inst} size="md" /></div>
            <div className="text-[10px] font-semibold truncate mt-1">{t.title}</div><div className="text-[9px] text-slate-400">CP {inst.cp} · HP {inst.hp}/{inst.maxHp}{over ? ' · over cap' : ''}</div>
          </button>) })}
      </div>
      {instances.length === 0 && <div className="glass rounded-2xl p-5 text-center text-slate-400">Catch tracks first!</div>}
      <button onClick={startFight} disabled={!party.length} className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-500 to-fuchsia-500 font-bold disabled:opacity-40">Start Battle ({party.length})</button>
    </div>
  )

  if (phase === 'fight' && B && activeTrack && enemy) {
    const eTrack = TRACK_BY_ID[enemy.trackId]
    const charged = chargedMoves(activeTrack.genre)[0]
    return (
      <div className="p-4 space-y-3">
        <div className="flex justify-between text-xs text-slate-400"><span>{target.avatar} {target.name}</span>{B.timeLeft != null && <span className={B.timeLeft < 20 ? 'text-red-400 font-bold' : ''}>⏱ {B.timeLeft}s</span>}<span>🛡️ {B.shields}</span></div>
        <div className="glass rounded-2xl p-3">
          <div className="flex items-center gap-3"><TrackArt track={eTrack} size="lg" /><div className="flex-1"><div className="flex justify-between text-sm font-bold"><span>{enemy.name}</span><span className="text-slate-400">CP {enemy.cp}</span></div><HpBar hp={enemy.hp} max={enemy.maxHp} /><div className="text-[10px] text-slate-400">{enemy.hp}/{enemy.maxHp} HP · {eTrack.genre}</div></div></div>
          <div className="flex gap-1 mt-2">{B.enemies.map((e, i) => <span key={i} className={`w-2.5 h-2.5 rounded-full ${e.hp <= 0 ? 'bg-slate-700' : i === B.ei ? 'bg-red-400' : 'bg-slate-500'}`} />)}</div>
        </div>
        <div className="glass rounded-2xl p-3">
          <div className="flex items-center gap-3"><TrackArt track={activeTrack} inst={activeInst} size="lg" /><div className="flex-1"><div className="flex justify-between text-sm font-bold"><span>{activeTrack.title}</span><span className="text-slate-400">CP {activeInst.cp}</span></div><HpBar hp={B.playerHp[activeInst.uid]} max={activeInst.maxHp} /><div className="text-[10px] text-slate-400">{B.playerHp[activeInst.uid]}/{activeInst.maxHp} HP · Energy {B.energy}/100</div><div className="h-1.5 bg-slate-800 rounded mt-1"><div className="h-full bg-amber-400 rounded" style={{ width: `${B.energy}%` }} /></div></div></div>
          <div className="flex gap-2 mt-2">{B.party.map((u, i) => { const inst = store.collection[u]; const t = TRACK_BY_ID[inst.trackId]; return <button key={u} onClick={() => switchTo(i)} disabled={B.playerHp[u] <= 0} className={`flex-1 rounded-lg py-1 text-[10px] ${i === B.pi ? 'bg-fuchsia-500/30 ring-1 ring-fuchsia-400' : 'bg-slate-800'} ${B.playerHp[u] <= 0 ? 'opacity-40' : ''}`}>{t.title} {B.playerHp[u]}</button> })}</div>
        </div>
        <div className="glass rounded-2xl p-3 h-24 overflow-y-auto no-scrollbar text-[11px] text-slate-300 space-y-1">{B.log.map((l, i) => <div key={i}>{l}</div>)}</div>
        {mini ? (
          <button onClick={() => setMini(m => ({ ...m, taps: m.taps + 1 }))} className="w-full py-6 rounded-2xl bg-gradient-to-r from-amber-500 to-red-500 font-black text-lg animate-pulse">TAP! {mini.move.name} · {mini.taps} taps
            <span className="block text-[10px] font-normal">Tap as fast as you can!</span></button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <button disabled={B.busy} onClick={() => playerAttack('fast')} className="py-3 rounded-2xl bg-slate-700 font-bold text-xs disabled:opacity-40 flex flex-col items-center"><Zap size={15} />{fastMoves(activeTrack.genre)[0].name}</button>
            <button disabled={B.busy || B.energy < charged.energy} onClick={() => playerAttack('charged')} className="py-3 rounded-2xl bg-amber-600 font-bold text-xs disabled:opacity-40 flex flex-col items-center"><Swords size={15} />{charged.name} ({charged.energy})</button>
            <button disabled={B.busy || B.shields <= 0} onClick={() => setB({ ...B, shieldArmed: !B.shieldArmed })} className={`py-3 rounded-2xl font-bold text-xs disabled:opacity-40 flex flex-col items-center ${B.shieldArmed ? 'bg-cyan-500' : 'bg-slate-700'}`}><Shield size={15} />Shield{B.shieldArmed ? ' ON' : ''}</button>
            <button disabled={B.busy} onClick={() => { if (store.consumeItem('potion')) { const u = activeInst.uid; setB({ ...B, playerHp: { ...B.playerHp, [u]: Math.min(activeInst.maxHp, B.playerHp[u] + 50) }, log: [...B.log, 'Used Energy Drink (+50)'].slice(-7) }) } else say('No Energy Drink') }} className="py-3 rounded-2xl bg-emerald-700 font-bold text-xs disabled:opacity-40 flex flex-col items-center"><HeartPulse size={15} />Potion</button>
          </div>
        )}
        {mini && <button onClick={resolveCharged} className="w-full py-3 rounded-2xl bg-white text-black font-bold">Unleash!</button>}
        <button onClick={() => finish(false, 'You fled the battle.')} className="w-full py-2 text-xs text-slate-400">Run away</button>
      </div>
    )
  }

  if (phase === 'result') return (
    <div className="p-4 text-center space-y-4">
      <div className="text-6xl">{result?.win ? '🏆' : '💔'}</div>
      <h2 className="text-2xl font-bold">{result?.win ? 'Victory!' : 'Defeat'}</h2>
      <p className="text-slate-400 text-sm">{result?.why || (result?.win ? 'Rewards added: XP & coins. Damaged tracks keep their HP — heal them!' : 'Heal your team and try again.')}</p>
      <button onClick={() => { setPhase('hub'); setB(null); setResult(null); setParty([]) }} className="w-full py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 font-bold">Back to Battle Hub</button>
      <button onClick={() => navigate('/collection')} className="w-full py-3 rounded-2xl bg-slate-800 font-bold">Heal in Collection</button>
    </div>
  )
  return null
}
function HpBar({ hp, max }) { const pct = Math.max(0, (hp / max) * 100); return <div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full transition-all ${pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} /></div> }
function Section({ title, children }) { return <div><h3 className="text-sm font-bold mb-2">{title}</h3><div className="space-y-2">{children}</div></div> }
function Row({ avatar, title, sub, btn, onClick }) { return <div className="glass rounded-2xl p-3 flex items-center gap-3"><span className="text-2xl">{avatar}</span><div className="flex-1"><div className="text-sm font-bold">{title}</div><div className="text-[10px] text-slate-400">{sub}</div></div><button onClick={onClick} className="px-3 py-2 rounded-xl bg-red-500/80 text-xs font-bold">{btn}</button></div> }
