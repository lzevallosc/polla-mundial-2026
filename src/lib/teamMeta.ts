export type TeamMeta = {
  flag: string
  code: string
}

export const teamMeta: Record<string, TeamMeta> = {
  'México': { flag: '🇲🇽', code: 'MX' },
  'Sudáfrica': { flag: '🇿🇦', code: 'ZA' },
  'Corea del Sur': { flag: '🇰🇷', code: 'KR' },
  'Chequia': { flag: '🇨🇿', code: 'CZ' },
  'Canadá': { flag: '🇨🇦', code: 'CA' },
  'Bosnia y Herzegovina': { flag: '🇧🇦', code: 'BA' },
  'Estados Unidos': { flag: '🇺🇸', code: 'US' },
  'Paraguay': { flag: '🇵🇾', code: 'PY' },
  'Haití': { flag: '🇭🇹', code: 'HT' },
  'Escocia': { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', code: 'SCO' },
  'Australia': { flag: '🇦🇺', code: 'AU' },
  'Türkiye': { flag: '🇹🇷', code: 'TR' },
  'Brasil': { flag: '🇧🇷', code: 'BR' },
  'Marruecos': { flag: '🇲🇦', code: 'MA' },
  'Qatar': { flag: '🇶🇦', code: 'QA' },
  'Suiza': { flag: '🇨🇭', code: 'CH' },
  'Alemania': { flag: '🇩🇪', code: 'DE' },
  'Curazao': { flag: '🇨🇼', code: 'CW' },
  'Países Bajos': { flag: '🇳🇱', code: 'NL' },
  'Japón': { flag: '🇯🇵', code: 'JP' },
  'Costa de Marfil': { flag: '🇨🇮', code: 'CI' },
  'Ecuador': { flag: '🇪🇨', code: 'EC' },
  'Túnez': { flag: '🇹🇳', code: 'TN' },
  'Nueva Zelanda': { flag: '🇳🇿', code: 'NZ' },
  'Bélgica': { flag: '🇧🇪', code: 'BE' },
  'Egipto': { flag: '🇪🇬', code: 'EG' },
  'España': { flag: '🇪🇸', code: 'ES' },
  'Cabo Verde': { flag: '🇨🇻', code: 'CV' },
  'Irán': { flag: '🇮🇷', code: 'IR' },
  'Uzbekistán': { flag: '🇺🇿', code: 'UZ' },
  'Arabia Saudita': { flag: '🇸🇦', code: 'SA' },
  'Uruguay': { flag: '🇺🇾', code: 'UY' },
  'Argentina': { flag: '🇦🇷', code: 'AR' },
  'Francia': { flag: '🇫🇷', code: 'FR' },
  'Portugal': { flag: '🇵🇹', code: 'PT' },
  'Inglaterra': { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', code: 'ENG' },
  'Colombia': { flag: '🇨🇴', code: 'CO' },
  'Croacia': { flag: '🇭🇷', code: 'HR' },
  'Dinamarca': { flag: '🇩🇰', code: 'DK' },
  'Senegal': { flag: '🇸🇳', code: 'SN' },
  'Perú': { flag: '🇵🇪', code: 'PE' },

  'Europe 1': { flag: '🇪🇺', code: 'EUR1' },
  'Europe 2': { flag: '🇪🇺', code: 'EUR2' },
  'Europe 3': { flag: '🇪🇺', code: 'EUR3' },
  'Europe 4': { flag: '🇪🇺', code: 'EUR4' },
  'IP Path 1': { flag: '🌎', code: 'IP1' },
  'IP Path 2': { flag: '🌎', code: 'IP2' },
}

export function getTeamFlag(team: string) {
  return teamMeta[team]?.flag ?? '🏳️'
}

export function getTeamCode(team: string) {
  return teamMeta[team]?.code ?? '---'
}

export function getTeamDisplayName(team: string) {
  return `${getTeamFlag(team)} ${team}`
}
