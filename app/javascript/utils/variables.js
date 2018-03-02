export const ITEM_TYPES = {
  TEXT: 'Item::TextItem',
  IMAGE: 'Item::ImageItem',
  VIDEO: 'Item::VideoItem',
}

export default {
  headerHeight: 160,
  maxWidth: 1400,
  containerPadding: {
    horizontal: '2rem',
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

  zIndex: {
    header: 100,
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
