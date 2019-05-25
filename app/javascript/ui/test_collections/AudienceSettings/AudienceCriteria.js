export const criteria = {
  Demographics: [
    { name: 'Age' },
    { name: 'Children' },
    { name: 'Country' },
    { name: 'Urban/Rural Dweller' },
    { name: 'Educaton' },
    { name: 'Employment Status' },
    { name: 'Gender' },
    { name: 'Financial Standing' },
  ],
  Psychographics: [
    { name: 'Early/Late Adopter' },
    { name: 'Interest' },
    { name: 'Publications' },
  ],
}

const ageOptions = [
  'Silent Generation (born 1928-1945)',
  'Baby Boomer (born 1946-1964)',
  'Gen X (born 1965-1980)',
  'Millennial (born 1981-1996)',
  'Gen Z (born 1995-2001)',
]

export const criteriaOptions = {
  Age: { options: ageOptions },
}
