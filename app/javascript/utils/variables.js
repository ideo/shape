// global vars from Rails application (or undefined, e.g. in a unit test)
export const FREEMIUM_USER_LIMIT = window.FREEMIUM_USER_LIMIT || 5

export const AUDIENCE_PRICES = {
  MIN_NUM_PAID_QUESTIONS:
    (window.AUDIENCE_PRICES && window.AUDIENCE_PRICES.MIN_NUM_PAID_QUESTIONS) ||
    10,
  TEST_PRICE_PER_QUESTION:
    (window.AUDIENCE_PRICES &&
      window.AUDIENCE_PRICES.TEST_PRICE_PER_QUESTION) ||
    0.12,
  TARGETED_AUDIENCE_MIN_PRICE_PER_RESPONSE:
    (window.AUDIENCE_PRICES &&
      window.AUDIENCE_PRICES.TARGETED_AUDIENCE_MIN_PRICE_PER_RESPONSE) ||
    4.0,
}

export const FOAMCORE_MAX_ZOOM = 3
export const FOUR_WIDE_MAX_ZOOM = 2

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
  TEST_RESULTS: 'Collection::TestResultsCollection',
  TEST_DESIGN: 'Collection::TestDesign',
}

export const COLLECTION_CARD_TYPES = {
  PRIMARY: 'CollectionCard::Primary',
  LINK: 'CollectionCard::Link',
  PLACEHOLDER: 'CollectionCard::Placeholder',
}

export const DATASET_CHART_TYPES = {
  AREA: 'area',
  LINE: 'line',
  BAR: 'bar',
}

export const DATA_MEASURES = [
  {
    name: 'Participants',
    value: 'participants',
    description:
      'Unique visitors that have commented or interacted with content',
  },
  {
    name: 'Viewers',
    value: 'viewers',
    description: 'Unique visitors that have viewed content',
  },
  {
    name: 'Activity',
    value: 'activity',
    description:
      'Total actions including adding items, editing content, commenting, downloading, and duplicating, moving, or linking content',
  },
  {
    name: 'Content Use',
    value: 'content',
    tooltip: 'content activities',
    description:
      'Total actions indicating content use: file downloads, PDF views, full-screen views, and link clicks',
  },
  {
    name: 'Collections',
    value: 'collections',
    description:
      'Total number of collections that exist (regular collections, foamcore collections, and submission box collections)',
  },
  {
    name: 'Items',
    value: 'items',
    description:
      'Total number of items that exist (text boxes, pictures and other media, files, links, and reports) ',
  },
  {
    name: 'Collections & Items',
    value: 'records',
    description:
      'Total number of collections and items that exist (regular collections, foamcore collections, and submission box collections, text boxes, pictures and other media, files, links, and reports) ',
  },
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
    category: 'Idea Ratings',
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
        value: 'question_open',
        label: 'Open Response',
        sections: ['intro', 'ideas', 'outro'],
      },
      {
        value: 'question_media',
        label: 'Photo/Video',
        // check on final AC...
        sections: ['intro', 'ideas', 'outro'],
      },
      {
        value: 'question_description',
        label: 'Text Block',
        sections: ['intro', 'ideas', 'outro'],
      },
      {
        value: 'question_single_choice',
        label: 'Single Choice',
        sections: ['intro', 'ideas', 'outro'],
      },
      {
        value: 'question_multiple_choice',
        label: 'Multiple Choice',
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

export const TOUCH_DEVICE_OS = {
  WINDOWS: 'Windows Phone',
  ANDROID: 'Android',
  IOS: 'iOS',
  UNKNOWN: 'Unknown',
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
  maxButtonTextLength: 8,
  maxPopoutMenuTextLength: 13,
  maxSelectMeasureTextLength: 20,
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
  collectionCoverOpacity: 0.4,

  cardHoldTime: 0.4 * 1000,
  touchDeviceHoldToDragTime: 1500,

  colors: {
    alert: '#d66742',
    black: '#120f0e',
    caution: '#fcf113',
    collectionCover: '#b6aaa6',
    commonDark: '#a89f9b',
    commonDarkest: '#787878',
    commonLight: '#f2f1ee',
    commonLightest: '#f5f4f3',
    commonMedium: '#c6c1bf',
    commonMediumTint: '#e3dedc',
    ctaPrimary: '#00a0e0',
    highlightActive: '#f8ed81',
    highlightInactive: '#fbf9dc',
    offset: '#6a7c7e',
    placeholderGray: '#bcbcbc',
    primaryDark: '#5698ae',
    primaryDarkest: '#35889e',
    primaryLight: '#c0dbde',
    primaryLightest: '#f0f4f6',
    primaryMedium: '#9ec1cc',
    primaryMediumDark: '#86b2b7',
    prototype: '#eae3ce',
    respondentBannerBackground: '#41d3bd',
    respondentBannerText: '#305d6c',
    secondaryDark: '#3f526a',
    secondaryDarkest: '#242d37',
    secondaryLight: '#5a6a7c',
    secondaryMedium: '#4a5b71',
    tertiaryDark: '#c43a31',
    tertiaryMedium: '#de8f74',
    transparent: 'transparent',
    white: '#ffffff',
    collaboratorPrimaryBlue: '#5473A6',
    collaboratorSecondaryBlue: '#C2CBD9',
    collaboratorPrimaryYellow: '#e8c547',
    collaboratorSecondaryYellow: '#EFE4BC',
    collaboratorPrimaryPurple: '#8B83A2',
    collaboratorSecondaryPurple: '#D3D0D7',
    collaboratorPrimaryOlive: '#84AF99',
    collaboratorSecondaryOlive: '#D1DDD4',
    collaboratorPrimarySalmon: '#DEA895',
    collaboratorSecondarySalmon: '#ECDBD3',
    collaboratorPrimaryIcyBlue: '#88B6C6',
    collaboratorSecondaryIcyBlue: '#D2DFE2',
    collaboratorPrimaryLavender: '#AE8CA3',
    collaboratorSecondaryLavender: '#DED3D8',
    collaboratorPrimaryObsidian: '#454545',
    collaboratorSecondaryObsidian: '#BEBDBB',
    collaboratorPrimarySlate: '#929E9E',
    collaboratorSecondarySlate: '#D5D8D6',
    collaboratorPrimaryGrey: '#738091',
    collaboratorSecondaryGrey: '#CCCFD2',
  },

  collaboratorColorNames: [
    'Blue',
    'Yellow',
    'Purple',
    'Olive',
    'Salmon',
    'IcyBlue',
    'Lavender',
    'Obsidian',
    'Slate',
    'Grey',
  ],

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
    zoomControls: 199,
    cardHovering: 160,
    gridCardTop: 151,
    gridCard: 150,
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
      'size',
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

  useTemplateSettings: {
    addToMyCollection: 1,
    letMePlaceIt: 2,
  },

  helperModalLabels: {
    templateHelperLabel: 'Thanks, please don’t ask me again.',
    templateHelperHint: ' This can be changed in your settings.',
    moveHelper: "Thanks, please don't show me this message again.",
  },

  userSettingsLabels: {
    useTemplateLabel: 'Add template instances to My Collection',
    useTemplateHint:
      'When using templates, choosing this setting will create template instances ' +
      'in your My Collection by default. Turning this off will allow you to place templates ' +
      'in any collection you have edit access to in Shape.',
    mailingListText: 'Mailing List',
    mailingListHint:
      'Stay current on new features and case studies by signing up ' +
      'for our mailing list',
  },
}
