export const primaryQualities = {
  purpose: {
    color: '#9874AB',
  },
  'looking out': {
    color: '#9A4F7A',
  },
  experimentation: {
    color: '#D26A3B',
  },
  collaboration: {
    color: '#EED950',
  },
  empowerment: {
    color: '#83CCB1',
  },
  refinement: {
    color: '#8A929D',
  },
}

export const subqualities = {
  usefulness: primaryQualities.purpose,
  passion: primaryQualities.purpose,
  clarity: primaryQualities.purpose,
  'market insightfulness': primaryQualities['looking out'],
  'tech insightfulness': primaryQualities['looking out'],
  'customer insightfulness': primaryQualities['looking out'],
  'user testing': primaryQualities.experimentation,
  'high-fidelity prototyping': primaryQualities.experimentation,
  'low-fidelity prototyping': primaryQualities.experimentation,
  modeling: primaryQualities.experimentation,
  'network informality': primaryQualities.collaboration,
  'team collaboraiton': primaryQualities.collaboration,
  'collaboration characteristics': primaryQualities.collaboration,
  'process clarity': primaryQualities.empowerment,
  opposability: primaryQualities.empowerment,
  fairness: primaryQualities.empowerment,
  autonomy: primaryQualities.empowerment,
  'risk tolerance': primaryQualities.empowerment,
  'visionary in implementation': primaryQualities.refinement,
  expert: primaryQualities.refinement,
  'technical creativity': primaryQualities.refinement,
  'detail orientation': primaryQualities.refinement,
}

export const creativeQualities = {
  ...primaryQualities,
  ...subqualities,
}

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
