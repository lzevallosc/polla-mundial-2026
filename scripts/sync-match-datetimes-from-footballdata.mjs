import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const FOOTBALL_DATA_TOKEN = process.env.FOOTBALL_DATA_TOKEN
const APPLY = process.argv.includes('--apply')

if (!SUPABASE_URL || !SERVICE_ROLE || !FOOTBALL_DATA_TOKEN) {
  console.error('Faltan variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o FOOTBALL_DATA_TOKEN')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
})

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const aliases = new Map([
  ['mexico', 'mexico'],
  ['south africa', 'south africa'],
  ['sudafrica', 'south africa'],

  ['south korea', 'south korea'],
  ['corea del sur', 'south korea'],
  ['korea republic', 'south korea'],
  ['republic of korea', 'south korea'],

  ['czechia', 'czechia'],
  ['chequia', 'czechia'],
  ['czech republic', 'czechia'],

  ['canada', 'canada'],
  ['bosnia and herzegovina', 'bosnia and herzegovina'],
  ['bosnia y herzegovina', 'bosnia and herzegovina'],

  ['united states', 'united states'],
  ['usa', 'united states'],
  ['estados unidos', 'united states'],
  ['paraguay', 'paraguay'],

  ['qatar', 'qatar'],
  ['switzerland', 'switzerland'],
  ['suiza', 'switzerland'],

  ['brazil', 'brazil'],
  ['brasil', 'brazil'],
  ['morocco', 'morocco'],
  ['marruecos', 'morocco'],

  ['haiti', 'haiti'],
  ['scotland', 'scotland'],
  ['escocia', 'scotland'],

  ['australia', 'australia'],
  ['turkiye', 'turkiye'],
  ['turkey', 'turkiye'],
  ['turkiye', 'turkiye'],
  ['türkiye', 'turkiye'],

  ['germany', 'germany'],
  ['alemania', 'germany'],
  ['curacao', 'curacao'],
  ['curazao', 'curacao'],
  ['curaçao', 'curacao'],

  ['netherlands', 'netherlands'],
  ['paises bajos', 'netherlands'],
  ['países bajos', 'netherlands'],
  ['japan', 'japan'],
  ['japon', 'japan'],
  ['japón', 'japan'],

  ['cote divoire', 'cote divoire'],
  ['cote d ivoire', 'cote divoire'],
  ['côte d ivoire', 'cote divoire'],
  ['costa de marfil', 'cote divoire'],
  ['ecuador', 'ecuador'],

  ['cape verde', 'cape verde'],
  ['cabo verde', 'cape verde'],
  ['cape verde islands', 'cape verde'],
  ['cabo verde islands', 'cape verde'],
  ['saudi arabia', 'saudi arabia'],
  ['arabia saudita', 'saudi arabia'],

  ['uruguay', 'uruguay'],
  ['spain', 'spain'],
  ['espana', 'spain'],
  ['españa', 'spain'],

  ['tunisia', 'tunisia'],
  ['tunez', 'tunisia'],
  ['túnez', 'tunisia'],

  ['new zealand', 'new zealand'],
  ['nueva zelanda', 'new zealand'],

  ['belgium', 'belgium'],
  ['belgica', 'belgium'],
  ['bélgica', 'belgium'],

  ['egypt', 'egypt'],
  ['egipto', 'egypt'],

  ['iran', 'iran'],
  ['ir iran', 'iran'],
  ['iran islamic republic', 'iran'],
  ['iran islamic republic of', 'iran'],
  ['irán', 'iran'],

  ['uzbekistan', 'uzbekistan'],
  ['uzbekistán', 'uzbekistan'],

  ['france', 'france'],
  ['francia', 'france'],
  ['senegal', 'senegal'],

  ['norway', 'norway'],
  ['noruega', 'norway'],

  ['argentina', 'argentina'],
  ['algeria', 'algeria'],
  ['argelia', 'algeria'],

  ['austria', 'austria'],
  ['jordan', 'jordan'],
  ['jordania', 'jordan'],

  ['portugal', 'portugal'],
  ['england', 'england'],
  ['inglaterra', 'england'],

  ['croatia', 'croatia'],
  ['croacia', 'croatia'],

  ['ghana', 'ghana'],
  ['panama', 'panama'],
  ['panamá', 'panama'],

  ['colombia', 'colombia'],
])

function canonical(value) {
  const n = normalize(value)
  return aliases.get(n) || n
}

function pairKey(home, away) {
  return `${canonical(home)}|${canonical(away)}`
}

function reversePairKey(home, away) {
  return `${canonical(away)}|${canonical(home)}`
}

function lima(value) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

console.log(APPLY ? 'MODO REAL: actualizando Supabase...' : 'MODO DRY-RUN: no actualiza nada...')

const apiResponse = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
  headers: { 'X-Auth-Token': FOOTBALL_DATA_TOKEN },
})

if (!apiResponse.ok) {
  console.error('Error football-data:', apiResponse.status, await apiResponse.text())
  process.exit(1)
}

const apiJson = await apiResponse.json()
const apiMatches = apiJson.matches || []

const apiById = new Map()
const apiByPair = new Map()
const apiByReversePair = new Map()

for (const match of apiMatches) {
  apiById.set(Number(match.id), match)
  apiByPair.set(pairKey(match.homeTeam?.name, match.awayTeam?.name), match)
  apiByReversePair.set(reversePairKey(match.homeTeam?.name, match.awayTeam?.name), match)
}

const { data: localMatches, error } = await supabase
  .from('matches')
  .select('id, match_number, home_team, away_team, match_datetime, api_match_id')
  .order('match_datetime', { ascending: true })

if (error) {
  console.error(error.message)
  process.exit(1)
}

const apiOwnerById = new Map()
for (const local of localMatches || []) {
  if (local.api_match_id) {
    apiOwnerById.set(Number(local.api_match_id), local.id)
  }
}

let matched = 0
let updated = 0
let unchanged = 0
let skippedDuplicateApiId = 0
const notFound = []

for (const local of localMatches || []) {
  const api =
    (local.api_match_id ? apiById.get(Number(local.api_match_id)) : null) ||
    apiByPair.get(pairKey(local.home_team, local.away_team)) ||
    apiByReversePair.get(pairKey(local.home_team, local.away_team))

  if (!api?.utcDate) {
    notFound.push({
      id: local.id,
      match_number: local.match_number,
      home: local.home_team,
      away: local.away_team,
      key: pairKey(local.home_team, local.away_team),
    })
    continue
  }

  matched += 1

  const oldIso = new Date(local.match_datetime).toISOString()
  const newIso = new Date(api.utcDate).toISOString()
  const changed = oldIso !== newIso || Number(local.api_match_id || 0) !== Number(api.id)

  if (!changed) {
    unchanged += 1
    continue
  }

  const apiId = Number(api.id)
  const currentOwner = apiOwnerById.get(apiId)

  if (currentOwner && currentOwner !== local.id) {
    skippedDuplicateApiId += 1
    console.log(
      `SKIP DUP API #${local.match_number} ${local.home_team} vs ${local.away_team} | api ${apiId} ya pertenece al match local ${currentOwner}`
    )
    continue
  }

  console.log(
    `#${local.match_number} ${local.home_team} vs ${local.away_team} | ${lima(oldIso)} -> ${lima(newIso)} | UTC ${newIso} | api ${api.id}`
  )

  if (APPLY) {
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        match_datetime: newIso,
        api_provider: 'football-data',
        api_match_id: apiId,
        api_synced_at: new Date().toISOString(),
      })
      .eq('id', local.id)

    if (updateError) {
      console.error(`Error actualizando match local ${local.id}:`, updateError.message)
      continue
    }

    apiOwnerById.set(apiId, local.id)
    updated += 1
  }
}

console.log('')
console.log('Resumen:')
console.log({ totalLocal: localMatches?.length || 0, matched, unchanged, updated, skippedDuplicateApiId, notFound: notFound.length })

if (notFound.length) {
  console.log('')
  console.log('No encontrados en API por nombre/id:')
  console.table(notFound.slice(0, 30))
  if (notFound.length > 30) {
    console.log(`... y ${notFound.length - 30} más`)
  }
}
