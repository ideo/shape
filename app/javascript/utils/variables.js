export const ITEM_TYPES = {
  TEXT: 'Item::TextItem',
  IMAGE: 'Item::ImageItem',
  VIDEO: 'Item::VideoItem',
}

export default {
  headerHeight: 160,
  headerHeightCompact: 100,
  maxWidth: 1400,
  containerPadding: {
    horizontal: '2rem',
  },

  // breakpoint sizes
  responsive: {
    // based on going from 2 -> 1 column
    smallBreakpoint: 645,
  },

  colors: {
    cararra: '#f2f1ee',
    desert: '#f5f4f3',
    cyan: '#c0dbde',
    gray: '#c6c1bf',
    cloudy: '#a89f9b',
    linkHover: '#06c',
    blackLava: '#120f0e',
  },

  fonts: {
    sans: 'Gotham',
    serif: 'Sentinel',
  },

  weights: {
    book: 300,
    medium: 500,
  },

  zIndex: {
    aboveClickWrapper: 501,
    clickWrapper: 500,
    header: 200,
    scrollIndicator: 200,
    cardDragging: 160,
    gridCard: 150,
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
}
