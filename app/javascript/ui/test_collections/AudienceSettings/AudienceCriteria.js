export const criteria = {
  Demographics: [
    { name: 'Age' },
    { name: 'Children' },
    { name: 'Country' },
    { name: 'Education' },
    { name: 'Employment Status' },
    { name: 'Gender' },
    { name: 'Financial Standing' },
    { name: 'Urban/Rural Dweller' },
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

const childrenOptions = [
  'None',
  'Children Under 12',
  'Children 12-17',
  'Children Over 17',
]

// TODO Get list of countries
const countryOptions = ['United Kingdom', 'United Stateds']

const educationOptions = [
  'High School',
  'Vocational',
  'College or Bachelor’s',
  'Postgraduate or Master’s',
  'Doctorate',
]

const employmentStatusOptions = [
  'Employed Full Time Job',
  'Employed Part-time',
  'Seeking Employment',
  'Student',
  'Retired',
]

const genderOptions = ['Female', 'Male', 'Non-Binary', 'Transexual']

const financialStandingOptions = [
  'Paying the monthly bills is a struggle',
  'Just breaking even',
  'Getting by, but should save more',
  'Living comfortably',
  'Spending freely',
]

const urbanRuralDwellerOptions = ['Metropolis', 'Urban', 'Suburban', 'Rural']

const earlyLateAdopterOptions = [
  'Early Adopter',
  'Early Majority',
  'Late Majority',
  'Laggard',
]

const interestOptions = [
  'Apps',
  'Athlete',
  'Car Owner',
  'Commuter',
  'Conscious Consumer',
  'Digital Native',
  'Entrepreneur',
  'Fashion',
  'Fast Food',
  'Fitness',
  'Foodie',
  'Frequent Flyer',
  'Gadgets',
  'Gamer',
  'Gardening',
  'Gig Economy',
  'Health Conscious',
  'Health Worker',
  'Home Improvement',
  'Home Owner',
  'Mindfulness/Yoga',
  'Outdoorsy',
  'Pet Owner',
  'Quantified Self',
  'Small Business Owner',
  'Smart Home',
  'Tradesman/woman',
  'Vegetarian',
  'Vegan',
]

const publicationsOptions = [
  'Architectural Digest',
  'Bloomberg Businessweek',
  'Cosmopolitan',
  'Elle',
  'Fast Company',
  'Food Network Magazine',
  'Forbes',
  'Fortune',
  'GQ',
  'Good Housekeeping',
  'InStyle',
  'Marie Claire',
  "Men's Health",
  'National Geographic',
  'People',
  'Popular Mechanics',
  'Popular Science',
  'Rolling Stone',
  'Sports Illustrated',
  'The New Yorker',
  'Time Out',
  'Time',
  'Us Weekly',
  'Vanity Fair',
  'Wired',
  "Women's Health",
]

export const criteriaOptions = {
  Age: { options: ageOptions },
  Children: { options: childrenOptions },
  Country: { options: countryOptions },
  Education: { options: educationOptions },
  'Employment Status': { options: employmentStatusOptions },
  Gender: { options: genderOptions },
  'Financial Standing': { options: financialStandingOptions },
  'Urban/Rural Dweller': { options: urbanRuralDwellerOptions },
  'Early/Late Adopter': { options: earlyLateAdopterOptions },
  Interest: { options: interestOptions },
  Publications: { options: publicationsOptions },
}
