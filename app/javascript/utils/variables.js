export const ITEM_TYPES = {
  TEXT: 'Item::TextItem',
  FILE: 'Item::FileItem',
  VIDEO: 'Item::VideoItem',
  LINK: 'Item::LinkItem',
  QUESTION: 'Item::QuestionItem',
  CHART: 'Item::ChartItem',
  DATA: 'Item::DataItem',
  EXTERNAL_IMAGE: 'Item::ExternalImageItem',
  LEGEND: 'Item::LegendItem',
}

export const COLLECTION_TYPES = {
  TEST: 'Collection::TestCollection',
  TEST_DESIGN: 'Collection::TestDesign',
}

export const DATASET_CHART_TYPES = {
  AREA: 'area',
  LINE: 'line',
}

export const DATA_MEASURES = [
  { name: 'Participants', value: 'participants' },
  { name: 'Viewers', value: 'viewers' },
  { name: 'Activity', value: 'activity' },
  { name: 'Content Use', value: 'content', tooltip: 'content activities' },
  { name: 'Collections', value: 'collections' },
  { name: 'Items', value: 'items' },
  { name: 'Collections & Items', value: 'records' },
]

export const TEST_COLLECTION_SELECT_OPTIONS = [
  { value: '', label: 'select question type' },
  { value: 'question_context', label: 'Context Setting' },
  { value: 'question_media', label: 'Photo or Video of Idea' },
  { value: 'question_description', label: 'Idea Description' },
  { value: 'question_useful', label: 'Useful' },
  { value: 'question_open', label: 'Open Response' },
  { value: 'question_excitement', label: 'Excitement' },
  { value: 'question_clarity', label: 'Clarity' },
  { value: 'question_different', label: 'Different' },
  { value: 'question_category_satisfaction', label: 'Category Satisfaction' },
]

export const KEYS = {
  ENTER: 13,
  ESC: 27,
}

export default {
  headerHeight: 50,
  maxWidth: 1320,
  containerPadding: {
    horizontal: 2,
  },
  topScrollTrigger: 210,
  maxTitleLength: 144,
  actionMenuWidth: 250,

  // Keep in sync with assets/stylesheets/core/base.scss
  responsive: {
    // based on going from 2 -> 1 column
    smallBreakpoint: 645,
    // based on going from 3 -> 2 cols
    medBreakpoint: 1060,
    largeBreakpoint: 1308,
    // material-ui Grid `sm` == 960px
    muiSmBreakpoint: 960,
  },

  transition: 'all 0.2s',
  transitionWithDelay: 'all 0.3s 0.2s',

  navOpacity: 0.9,

  cardHoldTime: 0.4 * 1000,

  colors: {
    black: '#120f0e',
    white: '#ffffff',
    commonLightest: '#f5f4f3',
    commonLight: '#f2f1ee',
    commonMedium: '#c6c1bf',
    commonDark: '#a89f9b',
    commonDarkest: '#787878',
    primaryLightest: '#f0f4f6',
    primaryLight: '#c0dbde',
    primaryMedium: '#9ec1cc',
    primaryMediumDark: '#86b2b7',
    primaryDark: '#5698ae',
    primaryDarkest: '#35889e',
    secondaryLight: '#73808f',
    secondaryMedium: '#5a6a7c',
    secondaryDark: '#3f526a',
    secondaryDarkest: '#242d37',
    tertiaryMedium: '#de8f74',
    tertiaryDark: '#c43a31',
    ctaPrimary: '#00a0e0',
    alert: '#d66742',
    caution: '#fcf113',
    offset: '#6a7c7e',
    placeholderGray: '#bcbcbc',
    transparent: 'transparent',
  },

  iconSizes: {
    bct: 47,
  },

  fonts: {
    baseSize: 16,
    sans: "'Gotham', sans-serif",
    serif: "'Sentinel', serif",
  },

  weights: {
    book: 400,
    medium: 500,
    bold: 700,
  },

  zIndex: {
    aboveClickWrapper: 501,
    clickWrapper: 500,
    activityLog: 251,
    // NOTE: if globalHeader is > pageHeader
    // then it will also be above the EditableName ClickWrapper
    cardDragging: 222,
    globalHeader: 221,
    pageHeader: 220,
    popoutMenu: 201,
    scrollIndicator: 200,
    cardHovering: 160,
    gridCard: 150,
    gridCardTop: 151,
    commentMentions: 100,
    commentHeader: 10,
    itemClose: 10,
    floatOverContent: 2,
    gridCardBg: 1,
    aboveVictoryChart: 100,
  },

  quillDefaults: {
    formats: ['link', 'header'],
    modules: {
      toolbar: [
        // header: false means "normal" i.e. no formatting
        [{ header: [3, false] }],
        ['link'],
      ],
    },
  },

  defaults: {
    video: {
      name: 'Video',
    },
  },
}
