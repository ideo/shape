// Use a map so we can preserve the order of the qualities
export const creativeQualities = new Map()
creativeQualities.set('purpose', {
  color: '#9874AB',
  subqualities: ['usefulness', 'passion', 'clarity'],
})
creativeQualities.set('looking out', {
  color: '#9A4F7A',
  subqualities: [
    'market insightfulness',
    'tech insightfulness',
    'customer insightfulness',
  ],
})
creativeQualities.set('experimentation', {
  color: '#D26A3B',
  subqualities: [
    'user testing',
    'high-fidelity prototyping',
    'low-fidelity prototyping',
    'modeling',
  ],
})
creativeQualities.set('collaboration', {
  color: '#EED950',
  subqualities: [
    'network informality',
    'team collaboration',
    'collaboration characteristics',
  ],
})
creativeQualities.set('empowerment', {
  color: '#83CCB1',
  subqualities: [
    'opposability',
    'fairness',
    'autonomy',
    'risk tolerance',
    'visionary in implementation',
  ],
})
creativeQualities.set('refinement', {
  color: '#8A929D',
  subqualities: ['expert', 'technical creativity', 'detail orientation'],
})

export const allQualityColors = {}
// Iterate over all qualities and subqualities
// and populate object with quality as key and color as value
creativeQualities.forEach((value, key) => {
  allQualityColors[key] = value.color
  value.subqualities.forEach(subquality => {
    allQualityColors[subquality] = value.color
  })
})

export const methodLibraryTypes = [
  'challenge',
  'worksheet',
  'ritual',
  'process',
  'article',
  'case study',
]

export const methodLibraryCategories = [
  'systematizing design process',
  'developing and nurturing talent',
  'design process',
  'experience design',
  'building and running labs',
  'developing creative problem solving capabilities',
  'building ventures',
  'research',
  'business models',
  'strategy',
  'marketing',
  'org design',
  'business design',
  'creative work',
]
