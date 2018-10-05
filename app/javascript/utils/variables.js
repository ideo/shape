export const ITEM_TYPES = {
  TEXT: 'Item::TextItem',
  FILE: 'Item::FileItem',
  VIDEO: 'Item::VideoItem',
  LINK: 'Item::LinkItem',
  QUESTION: 'Item::QuestionItem',
  CHART: 'Item::ChartItem',
}

export const COLLECTION_TYPES = {
  TEST: 'Collection::TestCollection',
  TEST_DESIGN: 'Collection::TestDesign',
}

export const KEYS = {
  ENTER: 13,
  ESC: 27,
}

export default {
  globalHeaderHeight: 73,
  headerHeight: 192,
  headerHeightCompact: 100,
  maxWidth: 1320,
  containerPadding: {
    horizontal: '2rem',
  },

  // Keep in sync with assets/stylesheets/core/base.scss
  responsive: {
    // based on going from 2 -> 1 column
    smallBreakpoint: 645,
    // based on going from 3 -> 2 cols
    medBreakpoint: 1060,
    largeBreakpoint: 1308,
  },

  transitionWithDelay: 'all 0.3s 0.2s',

  colors: {
    cararra: '#f2f1ee',
    desert: '#f5f4f3',
    cyan: '#b3cdd5',
    cyanLt: '#c0dbde',
    testLightBlueBg: '#9ec1cc',
    pacificBlue: '#00a0e0',
    activityLightBlue: '#73808f',
    activityMedBlue: '#5a6a7c',
    activityDarkBlue: '#3f526a',
    activityDarkestBlue: '#242d37',
    ctaButtonBlue: '#5698ae',
    ctaButtonBlueHover: '#35889e',
    aquaHaze: '#f0f4f6',
    gray: '#c6c1bf',
    cloudy: '#a89f9b',
    sirocco: '#6a7c7e',
    blackLava: '#120f0e',
    orange: '#d66742',
    white: '#ffffff',
    nearwhite: '#f7f7f7',
    cautionYellow: '#fcf113',
    placeholderGray: '#bcbcbc',
    transparent: 'transparent',
  },

  iconSizes: {
    bct: 47,
  },

  fonts: {
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
    cardDragging: 250,
    activityLog: 201,
    popoutMenu: 201,
    // NOTE: if globalHeader is > pageHeader
    // then it will also be above the EditableName ClickWrapper
    globalHeader: 200,
    pageHeader: 200,
    scrollIndicator: 200,
    gridCard: 150,
    gridCardTop: 151,
    commentMentions: 100,
    commentHeader: 10,
    itemClose: 10,
    floatOverContent: 2,
    gridCardBg: 1,
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
      thumbnailUrl: 'https://cdn.filestackcontent.com/jh0ytCnkRm6CgTaVulwr',
      name: 'Video',
    },
  },
}
