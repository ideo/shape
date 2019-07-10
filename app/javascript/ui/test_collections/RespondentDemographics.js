import countries from 'i18n-iso-countries'
import en from 'i18n-iso-countries/langs/en.json'
import _ from 'lodash'

const CHOICE_STYLE_SINGLE = 'single'
const CHOICE_STYLE_MULTIPLE = 'multiple'
const CHOICE_STYLE_SELECT = 'select'

const EDUCATION_HIGH_SCHOOL = 'High school'
const EDUCATION_VOCATIONAL = 'Vocational training'
const EDUCATION_COLLEGE = 'College or bachelor’s'
const EDUCATION_POSTGRADUTATE = 'Postgraduate or master’s'
const EDUCATION_DOCTORATE = 'Doctorate'
const EDUCATION_OTHER = 'Other'
const EDUCATION_NONE = 'None of these'

const GENDER_FEMALE = 'Female'
const GENDER_MALE = 'Male'
const GENDER_NONBINARY = 'Non-binary'
const GENDER_OTHER = 'Other'
const GENDER_DECLINE = 'Prefer not to say'

const INCOME_LOW = 'Low Income'
const INCOME_MEDIUM = 'Medium Income'
const INCOME_ABOVE_AVERAGE = 'Above Average Income'

const ADOPTER_VERY_EARLY = 'Early Adopter'
const ADOPTER_EARLY = 'Early Majority'
const ADOPTER_LATE = 'Late Majority'
const ADOPTER_VERY_LATE = 'Laggard'

const RESIDENCE_METRO = 'Metropolis Dweller'
const RESIDENCE_URBAN = 'Urban Dweller'
const RESIDENCE_SUBURBAN = 'Suburban Dweller'
const RESIDENCE_RURAL = 'Rural Dweller'

const CHILDREN_NO = 'No Children'
const CHILDREN_YOUNG = 'Parents of young children'
const CHILDREN_TEEN = 'Parents of teenagers'
const CHILDREN_ADULT = 'Parents of adult children'

const EMPLOYMENT_FULLTIME = 'Full-time'
const EMPLOYMENT_PARTTIME = 'Part-time'
const EMPLOYMENT_SEEKER = 'Job Seeker'
const EMPLOYMENT_STUDENT = 'Student'
const EMPLOYMENT_RETIRED = 'Retired'
const EMPLOYMENT_OTHER = 'Other'

countries.registerLocale(en)
const countryNames = Object.entries(countries.getNames('en'))

const birthYearsStart = 1920
const birthYearsEnd = new Date().getFullYear()
const birthYears = _.range(birthYearsStart, birthYearsEnd)

const choiceStyleCardQuestionTypeMap = {
  [CHOICE_STYLE_SINGLE]: 'question_demographics_single_choice',
  [CHOICE_STYLE_MULTIPLE]: 'question_demographics_multiple_choice',
  [CHOICE_STYLE_SELECT]: 'question_demographics_single_choice_menu',
}

const questions = [
  {
    text: `In which country do you live?`,
    category: 'countries',
    choiceStyle: CHOICE_STYLE_SELECT,
    choices: countryNames.map(([code, name]) => ({
      text: name,
      tags: [],
    })),
  },
  {
    text: `In what year were you born? (Please type your birth year)`,
    category: 'birth_year',
    choiceStyle: CHOICE_STYLE_SELECT,
    choices: birthYears.map(year => ({
      text: `${year}`,
      tags: [],
    })),
  },
  {
    text: `What’s the highest level of education you have completed?`,
    category: 'education_levels',
    choiceStyle: CHOICE_STYLE_SINGLE,
    choices: [
      { text: `High school diploma`, tags: [EDUCATION_HIGH_SCHOOL] },
      { text: `Vocational training`, tags: [EDUCATION_VOCATIONAL] },
      { text: `College or bachelor’s degree`, tags: [EDUCATION_COLLEGE] },
      {
        text: `Postgraduate or master’s degree`,
        tags: [EDUCATION_POSTGRADUTATE],
      },
      { text: `Doctorate degree`, tags: [EDUCATION_DOCTORATE] },
      { text: `Other`, tags: [EDUCATION_OTHER] },
      { text: `None of these`, tags: [EDUCATION_NONE] },
    ],
  },
  {
    text: `What is your gender?`,
    category: 'genders',
    choiceStyle: CHOICE_STYLE_SINGLE,
    choices: [
      { text: `Female`, tags: [GENDER_FEMALE] },
      { text: `Male`, tags: [GENDER_MALE] },
      { text: `Non-binary`, tags: [GENDER_NONBINARY] },
      { text: `Other`, tags: [GENDER_OTHER] },
      { text: `Prefer not to say`, tags: [GENDER_DECLINE] },
    ],
  },
  {
    text: `Which of the following best describes where you stand financially?`,
    category: 'income_levels',
    choiceStyle: CHOICE_STYLE_SINGLE,
    choices: [
      {
        text: `Sometimes paying the monthly bills is a struggle`,
        tags: [INCOME_LOW],
      },
      {
        text: `Living month to month and just breaking even`,
        tags: [INCOME_LOW, INCOME_MEDIUM],
      },
      {
        text: `Have enough but should save more`,
        tags: [INCOME_MEDIUM],
      },
      {
        text: `Living comfortably, with some money left over at the end of each month`,
        tags: [INCOME_ABOVE_AVERAGE],
      },
      {
        text: `Living very comfortably, and spending freely on things I enjoy`,
        tags: [INCOME_ABOVE_AVERAGE],
      },
    ],
  },
  {
    text: `Which of these statements best describes you?`,
    category: 'adopter_types',
    choiceStyle: CHOICE_STYLE_SINGLE,
    choices: [
      {
        text: `I’m always the first of my friends to try new products and services. I’ll camp out in line over night if it means being first!`,
        tags: [ADOPTER_VERY_EARLY],
      },
      {
        text: `I’m usually one of the first to try a new product or service, but I’ll wait for the long line to die down.`,
        tags: [ADOPTER_VERY_EARLY],
      },
      {
        text: `I’m happy to try new products or services if sources I respect vouch for them`,
        tags: [ADOPTER_EARLY],
      },
      {
        text: `If over time I continually hear great things about a product or service, I’d be willing to try it out.`,
        tags: [ADOPTER_LATE],
      },
      {
        text: `I prefer to stick with my tried and trusted brands and products`,
        tags: [ADOPTER_LATE, ADOPTER_VERY_LATE],
      },
    ],
  },
  {
    text: `Which of these best describes where you live?`,
    category: 'dweller_types',
    choiceStyle: CHOICE_STYLE_SINGLE,
    choices: [
      {
        text: `Metropolis: my city never sleeps`,
        tags: [RESIDENCE_METRO, RESIDENCE_URBAN],
      },
      {
        text: `City: it’s all about the hustle and bustle`,
        tags: [RESIDENCE_URBAN],
      },
      {
        text: `Suburban area: it’s peaceful, but within easy reach of a city`,
        tags: [RESIDENCE_SUBURBAN],
      },
      {
        text: `Rural area: there’s nature all around and going to the city is a trip`,
        tags: [RESIDENCE_RURAL],
      },
    ],
  },
  {
    text: `Do you have any children?`,
    category: 'children_ages',
    choiceStyle: CHOICE_STYLE_MULTIPLE,
    choices: [
      { text: `No`, tags: [CHILDREN_NO] },
      {
        text: `Yes, I have one or more kids younger than 12`,
        tags: [CHILDREN_YOUNG],
      },
      {
        text: `Yes, I have one or more kids aged 12-17`,
        tags: [CHILDREN_TEEN],
      },
      {
        text: `Yes, but my kids are older than 17`,
        tags: [CHILDREN_ADULT],
      },
    ],
  },
  {
    text: `Which best describes your work situation?`,
    category: 'employment_types',
    choiceStyle: CHOICE_STYLE_MULTIPLE,
    choices: [
      {
        text: `I have a full time job (35+ hours per week)`,
        tags: [EMPLOYMENT_FULLTIME],
      },
      { text: `I work part time`, tags: [EMPLOYMENT_PARTTIME] },
      { text: `I’m currently looking for a job`, tags: [EMPLOYMENT_SEEKER] },
      { text: `I’m a student (full or part time)`, tags: [EMPLOYMENT_STUDENT] },
      { text: `I’m retired`, tags: [EMPLOYMENT_RETIRED] },
      { text: `Other`, tags: [EMPLOYMENT_OTHER] },
    ],
  },
]

export function allDemographicQuestions() {
  return questions
}

export function cardQuestionTypeForQuestion(question) {
  return choiceStyleCardQuestionTypeMap[question.choiceStyle]
}

export function createDemographicsCardId(question) {
  const category = _.kebabCase(question.category)
  return `card-demographics-${category}`
}

export function validDemographicsCategories() {
  return _.uniq(questions.map(q => q.category))
}
