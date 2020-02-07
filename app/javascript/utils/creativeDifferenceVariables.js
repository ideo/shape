// Use a map so we can preserve the order of the qualities
export const creativeQualities = new Map()
creativeQualities.set('purpose', {
  color: '#9874AB',
  subqualities: ['clarity', 'usefulness', 'passion'],
})
creativeQualities.set('looking out', {
  color: '#9A4F7A',
  subqualities: [
    'market insightfulness',
    'customer insightfulness',
    'tech insightfulness',
  ],
})
creativeQualities.set('experimentation', {
  color: '#D26A3B',
  subqualities: [
    'low-fidelity prototyping',
    'high-fidelity prototyping',
    'user testing',
    'modeling',
  ],
})
creativeQualities.set('collaboration', {
  color: '#EED950',
  subqualities: [
    'team collaboration',
    'network informality',
    'diversity of perspective',
    'collaboration characteristics',
  ],
})
creativeQualities.set('empowerment', {
  color: '#83CCB1',
  subqualities: [
    'fairness',
    'opposability',
    'autonomy',
    'risk tolerance',
    'process clarity',
  ],
})
creativeQualities.set('refinement', {
  color: '#8A929D',
  subqualities: [
    'visionary in implementation',
    'technical creativity',
    'detail orientation',
    'expert',
  ],
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

export const methodLibraryTagsByType = {
  creativeQualities,
  categories: [
    'systemizing design process',
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
  ],
  types: [
    'challenge',
    'worksheet',
    'ritual',
    'process',
    'article',
    'case study',
  ],
}

export const methodLibraryTags = [
  ...Object.keys(allQualityColors),
  ...methodLibraryTagsByType.categories,
  ...methodLibraryTagsByType.types,
]
