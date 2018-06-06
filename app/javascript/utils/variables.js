export const ITEM_TYPES = {
  TEXT: 'Item::TextItem',
  IMAGE: 'Item::ImageItem',
  VIDEO: 'Item::VideoItem',
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

  // breakpoint sizes
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
    cyan: '#c0dbde',
    pacificBlue: '#00a0e0',
    activityLightBlue: '#73808f',
    activityMedBlue: '#5a6a7c',
    activityDarkBlue: '#3f526a',
    activityDarkestBlue: '#242d37',
    aquaHaze: '#f0f4f6',
    gray: '#c6c1bf',
    cloudy: '#a89f9b',
    sirocco: '#6a7c7e',
    blackLava: '#120f0e',
    orange: '#d66742',
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
  },

  zIndex: {
    aboveClickWrapper: 501,
    clickWrapper: 500,
    activityLog: 201,
    popoutMenu: 201,
    globalHeader: 200,
    pageHeader: 199,
    scrollIndicator: 200,
    cardDragging: 160,
    gridCard: 150,
    gridCardTop: 151,
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
      ]
    }
  },

  defaults: {
    video: {
      thumbnailUrl: 'https://cdn.filestackcontent.com/jh0ytCnkRm6CgTaVulwr',
      name: 'Video',
    }
  }
}
