export type TeamMeta = {
  code: string
  flagUrl?: string
  fallbackType?: 'badge'
}

const makeFlag = (code: string) =>
  `https://flagcdn.com/w40/${code.toLowerCase()}.png`

export const teamMeta: Record<string, TeamMeta> = {
  'México': { code: 'MX', flagUrl: makeFlag('MX') },
  'Sudáfrica': { code: 'ZA', flagUrl: makeFlag('ZA') },
  'Corea del Sur': { code: 'KR', flagUrl: makeFlag('KR') },
  'Chequia': { code: 'CZ', flagUrl: makeFlag('CZ') },
  'Canadá': { code: 'CA', flagUrl: makeFlag('CA') },
  'Bosnia y Herzegovina': { code: 'BA', flagUrl: makeFlag('BA') },
  'Estados Unidos': { code: 'US', flagUrl: makeFlag('US') },
  'Paraguay': { code: 'PY', flagUrl: makeFlag('PY') },
  'Haití': { code: 'HT', flagUrl: makeFlag('HT') },
  'Australia': { code: 'AU', flagUrl: makeFlag('AU') },
  'Türkiye': { code: 'TR', flagUrl: makeFlag('TR') },
  'Brasil': { code: 'BR', flagUrl: makeFlag('BR') },
  'Marruecos': { code: 'MA', flagUrl: makeFlag('MA') },
  'Qatar': { code: 'QA', flagUrl: makeFlag('QA') },
  'Suiza': { code: 'CH', flagUrl: makeFlag('CH') },
  'Alemania': { code: 'DE', flagUrl: makeFlag('DE') },
  'Curazao': { code: 'CW', flagUrl: makeFlag('CW') },
  'Países Bajos': { code: 'NL', flagUrl: makeFlag('NL') },
  'Japón': { code: 'JP', flagUrl: makeFlag('JP') },
  'Costa de Marfil': { code: 'CI', flagUrl: makeFlag('CI') },
  'Ecuador': { code: 'EC', flagUrl: makeFlag('EC') },
  'Túnez': { code: 'TN', flagUrl: makeFlag('TN') },
  'Nueva Zelanda': { code: 'NZ', flagUrl: makeFlag('NZ') },
  'Bélgica': { code: 'BE', flagUrl: makeFlag('BE') },
  'Egipto': { code: 'EG', flagUrl: makeFlag('EG') },
  'España': { code: 'ES', flagUrl: makeFlag('ES') },
  'Cabo Verde': { code: 'CV', flagUrl: makeFlag('CV') },
  'Irán': { code: 'IR', flagUrl: makeFlag('IR') },
  'Uzbekistán': { code: 'UZ', flagUrl: makeFlag('UZ') },
  'Arabia Saudita': { code: 'SA', flagUrl: makeFlag('SA') },
  'Uruguay': { code: 'UY', flagUrl: makeFlag('UY') },
  'Argentina': { code: 'AR', flagUrl: makeFlag('AR') },
  'Francia': { code: 'FR', flagUrl: makeFlag('FR') },
  'Portugal': { code: 'PT', flagUrl: makeFlag('PT') },
  'Colombia': { code: 'CO', flagUrl: makeFlag('CO') },
  'Croacia': { code: 'HR', flagUrl: makeFlag('HR') },
  'Dinamarca': { code: 'DK', flagUrl: makeFlag('DK') },
  'Senegal': { code: 'SN', flagUrl: makeFlag('SN') },
  'Perú': { code: 'PE', flagUrl: makeFlag('PE') },
  'Noruega': { code: 'NO', flagUrl: makeFlag('NO') },
  'Argelia': { code: 'DZ', flagUrl: makeFlag('DZ') },
  'Austria': { code: 'AT', flagUrl: makeFlag('AT') },
  'Jordania': { code: 'JO', flagUrl: makeFlag('JO') },
  'Ghana': { code: 'GH', flagUrl: makeFlag('GH') },
  'Panamá': { code: 'PA', flagUrl: makeFlag('PA') },


  'Escocia': { code: 'SCO', fallbackType: 'badge' },
  'Inglaterra': { code: 'ENG', fallbackType: 'badge' },
  'Europe 1': { code: 'EUR1', fallbackType: 'badge' },
  'Europe 2': { code: 'EUR2', fallbackType: 'badge' },
  'Europe 3': { code: 'EUR3', fallbackType: 'badge' },
  'Europe 4': { code: 'EUR4', fallbackType: 'badge' },
  'IP Path 1': { code: 'IP1', fallbackType: 'badge' },
  'IP Path 2': { code: 'IP2', fallbackType: 'badge' },
}

export function getTeamCode(team: string) {
  return teamMeta[team]?.code ?? '---'
}

export function getTeamFlagUrl(team: string) {
  return teamMeta[team]?.flagUrl ?? null
}

export function hasImageFlag(team: string) {
  return Boolean(teamMeta[team]?.flagUrl)
}

export function getTeamFlag(team: string) {
  return teamMeta[team]?.code ?? '---'
}

export function getTeamDisplayName(team: string) {
  return `${getTeamCode(team)} ${team}`
}
