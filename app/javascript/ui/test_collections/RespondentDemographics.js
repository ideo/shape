import { kebabCase, uniq } from 'lodash'

const CHOICE_STYLE_SINGLE = 'single'

const EDUCATION_HIGH_SCHOOL = `High school diploma`
const EDUCATION_VOCATIONAL = `Vocational training`
const EDUCATION_COLLEGE = `College or bachelor’s degree`
const EDUCATION_POSTGRADUTATE = `Postgraduate or master’s degree`
const EDUCATION_DOCTORATE = `Doctorate degree`
const EDUCATION_OTHER = `Other`
const EDUCATION_NONE = `None of these`

const GENDER_FEMALE = `Female`
const GENDER_MALE = `Male`
const GENDER_NB = `Non-binary`
const GENDER_OTHER = `Other`
const GENDER_DECLINE = `Prefer not to say`

const INCOME_LOW = 'low income'
const INCOME_MEDIUM = 'medium income'
const INCOME_GTAVG = 'above average income'

const ADOPTER_VERY_EARLY = 'early adopter'
const ADOPTER_EARLY = 'early majority'
const ADOPTER_LATE = 'late majority'
const ADOPTER_VERY_LATE = 'late majority / laggard'

const RESIDENCE_METRO = 'metropolis dweller'
const RESIDENCE_URBAN = 'urban dweller'
const RESIDENCE_SUBURBAN = 'suburban dweller'
const RESIDENCE_RURAL = 'rural dweller'

const choiceStyleCardQuestionTypeMap = {
  [CHOICE_STYLE_SINGLE]: 'question_demographics_single_choice',
}

const questions = [
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
      { text: `Non-binary`, tags: [GENDER_NB] },
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
        tags: [INCOME_GTAVG],
      },
      {
        text: `Living very comfortably, and spending freely on things I enjoy`,
        tags: [INCOME_GTAVG],
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
        tags: [ADOPTER_VERY_LATE],
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
]

export function allDemographicQuestions() {
  return questions
}

export function cardQuestionTypeForQuestion(question) {
  return choiceStyleCardQuestionTypeMap[question.choiceStyle]
}

export function createDemographicsCardId(question) {
  const category = kebabCase(question.category)
  const title = kebabCase(question.text)

  return `card-demographics-${category}-${title}`
}

export function validDemographicsCategories() {
  return uniq(questions.map(q => q.category))
}
