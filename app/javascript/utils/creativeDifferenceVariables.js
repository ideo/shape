export const primaryQualities = {
  Purpose: {
    color: '#9874AB',
  },
  'Looking Out': {
    color: '#9A4F7A',
  },
  Experimentation: {
    color: '#D26A3B',
  },
  Collaboration: {
    color: '#EED950',
  },
  Empowerment: {
    color: '#83CCB1',
  },
  Refinement: {
    color: '#8A929D',
  },
}

export const subqualities = {
  Usefulness: primaryQualities.Purpose,
  Passion: primaryQualities.Purpose,
  Clarity: primaryQualities.Purpose,
  'Market Insightfulness': primaryQualities['Looking Out'],
  'Tech Insightfulness': primaryQualities['Looking Out'],
  'Customer Insightfulness': primaryQualities['Looking Out'],
  'User Testing': primaryQualities.Experimentation,
  'High-Fidelity Prototyping': primaryQualities.Experimentation,
  'Low-Fidelity Prototyping': primaryQualities.Experimentation,
  Modeling: primaryQualities.Experimentation,
  'Network Informality': primaryQualities.Collaboration,
  'Team Collaboraiton': primaryQualities.Collaboration,
  'Collaboration Characteristics': primaryQualities.Collaboration,
  'Process Clarity': primaryQualities.Empowerment,
  Opposability: primaryQualities.Empowerment,
  Fairness: primaryQualities.Empowerment,
  Autonomy: primaryQualities.Empowerment,
  'Risk Tolerance': primaryQualities.Empowerment,
  'Visionary in Implementation': primaryQualities.Refinement,
  Expert: primaryQualities.Refinement,
  'Technical Creativity': primaryQualities.Refinement,
  'Detail Orientation': primaryQualities.Refinement,
}

export const creativeQualities = {
  ...primaryQualities,
  ...subqualities,
}
