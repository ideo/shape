// global vars from Rails application (or undefined, e.g. in a unit test)
export const FEEDBACK_INCENTIVE_AMOUNT = window.FEEDBACK_INCENTIVE_AMOUNT || 2.5
export const TARGETED_AUDIENCE_PRICE_PER_RESPONSE =
  window.TARGETED_AUDIENCE_PRICE_PER_RESPONSE || 2
export const FREEMIUM_USER_LIMIT = window.FREEMIUM_USER_LIMIT || 5

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
  BAR: 'bar',
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
  {
    values: [
      {
        value: '',
        label: 'select question type',
        sections: ['intro', 'ideas', 'outro'],
      },
    ],
  },
  {
    category: 'Idea Content',
    values: [
      {
        value: 'question_description',
        label: 'Description',
        sections: ['ideas'],
      },
      // TODO: these won't actually be in the dropdown once there's the carousel
      {
        value: 'question_idea_placeholder',
        label: 'Idea (pl)',
        sections: ['ideas'],
      },
      { value: 'question_idea', label: 'Idea', sections: ['ideas'] },
    ],
  },
  {
    category: 'Scaled Rating',
    values: [
      { value: 'question_clarity', label: 'Clear', sections: ['ideas'] },
      { value: 'question_different', label: 'Different', sections: ['ideas'] },
      { value: 'question_excitement', label: 'Exciting', sections: ['ideas'] },
      { value: 'question_useful', label: 'Useful', sections: ['ideas'] },
    ],
  },
  {
    category: 'Customizable',
    values: [
      {
        value: 'question_category_satisfaction',
        label: 'Category Satisfaction',
        sections: ['intro'],
      },
      {
        value: 'question_context',
        label: 'Context Setting',
        sections: ['intro'],
      },
      {
        value: 'question_open',
        label: 'Open Response',
        sections: ['intro', 'ideas', 'outro'],
      },
    ],
  },
]

export const KEYS = {
  ENTER: 13,
  ESC: 27,
}

export const EVENT_SOURCE_TYPES = {
  GRID_CARD: 'gridCard',
  AUDIENCE_SETTINGS: 'audienceSettings',
  PAGE_MENU: 'pageMenu',
  BCT_MENU: 'bctMenu',
  TEXT_EDITOR: 'textEditor',
}

// warning: don't change, modify component based offsets instead. see: clickUtils::calculatePopoutMenuOffset
export const INITIAL_OFFSET_X = 20
export const INITIAL_OFFSET_Y = 90

export const quillSelectors =
  '.quill, .ql-close, .ql-toolbar, .ql-container, .ql-editor, .ql-clipboard, .quill-toolbar, .ql-formats, .ql-header, .ql-link, .ql-stroke'

export default {
  headerHeight: 50,
  maxWidth: 1320,
  containerPadding: {
    horizontal: 2,
  },
  topScrollTrigger: 210,
  maxTitleLength: 144,
  actionMenuWidth: 250,
  actionMenuHeight: 26,

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

  cardTiltDegrees: -5, // tilt left

  transition: 'all 0.2s',
  transitionWithDelay: 'all 0.3s 0.2s',

  navOpacity: 0.9,

  cardHoldTime: 0.4 * 1000,
  touchDeviceHoldToDragTime: 1000,

  colors: {
    black: '#120f0e',
    white: '#ffffff',
    commonLightest: '#f5f4f3',
    commonLight: '#f2f1ee',
    commonMediumTint: '#e3dedc',
    commonMedium: '#c6c1bf',
    commonDark: '#a89f9b',
    commonDarkest: '#787878',
    primaryLightest: '#f0f4f6',
    primaryLight: '#c0dbde',
    primaryMedium: '#9ec1cc',
    primaryMediumDark: '#86b2b7',
    primaryDark: '#5698ae',
    primaryDarkest: '#35889e',
    secondaryLight: '#5a6a7c',
    secondaryMedium: '#4a5b71',
    secondaryDark: '#3f526a',
    secondaryDarkest: '#242d37',
    tertiaryMedium: '#de8f74',
    tertiaryDark: '#c43a31',
    ctaPrimary: '#00a0e0',
    alert: '#d66742',
    highlightActive: '#f8ed81',
    highlightInactive: '#fbf9dc',
    caution: '#fcf113',
    offset: '#6a7c7e',
    placeholderGray: '#bcbcbc',
    transparent: 'transparent',
    respondentBannerBackground: '#41d3bd',
    respondentBannerText: '#305d6c',
  },

  buttonSizes: {
    header: {
      width: 160,
      fontSize: 0.825,
    },
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
    commentMentions: 255,
    commentHeader: 252,
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
    itemClose: 10,
    floatOverContent: 2,
    gridCardBg: 1,
    aboveVictoryChart: 100,
  },

  quillDefaults: {
    formats: [
      'link',
      'header',
      'commentHighlight',
      'commentHighlightResolved',
      'highlight',
    ],
    modules: {
      toolbar: null,
    },
  },

  defaults: {
    video: {
      name: 'Video',
    },
  },

  defaultGridSettings: {
    // layout will track we are at "size 3" i.e. "small 4 cols" even though cols === 4
    layoutSize: 4,
    cols: 4,
    gutter: 14,
    gridW: 316,
    gridH: 250,
  },

  smallGridSettings: {
    gutter: 14,
    gridW: 253,
    gridH: 200,
  },

  commentScrollOpts: {
    containerId: 'ctc-content',
    bottom: 'ctc-bottom',
    delay: 0,
    duration: 350,
    smooth: true,
  },
}
