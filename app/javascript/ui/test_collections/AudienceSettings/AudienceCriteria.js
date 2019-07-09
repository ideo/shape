import { invert, uniq } from 'lodash'

const criteria = [
  {
    name: 'Age',
    group: 'Demographics',
    options: [
      'Baby Boomer (born 1946-1964)',
      'Gen X (born 1965-1980)',
      'Millennial (born 1981-1996)',
      'Gen Z (born 1995-2001)',
    ],
  },
  {
    name: 'Children',
    group: 'Demographics',
    options: [
      'No Children',
      'Parents of young children',
      'Parents of teenagers',
      'Parents of adult children',
    ],
  },
  {
    name: 'Country',
    group: 'Demographics',
    options: [
      'Australia',
      'Canada',
      'United Kingdom',
      'United States of America',
    ],
  },
  {
    name: 'Education',
    group: 'Demographics',
    options: ['High School', 'College or Bachelor’s'],
  },
  { name: 'Gender', group: 'Demographics', options: ['Female', 'Male', 'All'] },
  {
    name: 'Early/Late Adopter',
    group: 'Psychographics',
    options: ['Early Adopter', 'Early Majority', 'Late Majority', 'Laggard'],
  },
  {
    name: 'Interest',
    group: 'Psychographics',
    options: [
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
    ],
  },
  {
    name: 'Publications',
    group: 'Psychographics',
    options: [
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
    ],
  },
]

export const criteriaLimitByGroup = {
  Psychographics: 2,
}

const getCriteriaBy = (key, value) =>
  criteria.filter(criterion => criterion[key] === value)

const getCriteriaGroups = () =>
  uniq(criteria.reduce((acc, criterion) => [...acc, criterion.group], []))

const getCriteriaByGroup = group => getCriteriaBy('group', group)

export const getCriterionByName = name => {
  const criteria = getCriteriaBy('name', name)[0]
  const tagList = criteriaToTagLists[name]
  return {
    ...criteria,
    tagList,
  }
}

export const groupCriteriaByGroup = () =>
  getCriteriaGroups().reduce(
    (acc, group) => [...acc, [group, getCriteriaByGroup(group)]],
    []
  )

export const tagListsToCriteria = {
  age_list: 'Age',
  children_age_list: 'Children',
  country_list: 'Country',
  education_level_list: 'Education',
  gender_list: 'Gender',
  adopter_type_list: 'Early/Late Adopter',
  interest_list: 'Interest',
  publication_list: 'Publications',
}

export const criteriaToTagLists = invert(tagListsToCriteria)
