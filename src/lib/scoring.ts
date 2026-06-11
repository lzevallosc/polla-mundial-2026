export function getMatchResult(home: number, away: number) {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

export function calculateMatchPoints(params: {
  predictedHome: number
  predictedAway: number
  realHome: number
  realAway: number
}) {
  const { predictedHome, predictedAway, realHome, realAway } = params

  let points = 0

  const predictedResult = getMatchResult(predictedHome, predictedAway)
  const realResult = getMatchResult(realHome, realAway)

  if (predictedResult === realResult) points += 3
  if (predictedHome === realHome) points += 1
  if (predictedAway === realAway) points += 1
  if (predictedHome === realHome && predictedAway === realAway) points += 5

  return Math.min(points, 10)
}
