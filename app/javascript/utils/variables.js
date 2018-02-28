export const ITEM_TYPES = {
  TEXT: 'Item::TextItem',
  IMAGE: 'Item::ImageItem',
  VIDEO: 'Item::VideoItem',
}

export default {
  headerHeight: 150,
  maxWidth: 1400,
  containerPadding: {
    horizontal: '2rem',
  },

  colors: {
    placeholder: '#d6fffe',
    teal: '#00bfa3',
    cyan: '#c0dbde',
    cyanLight: '#f0f4f6',
    darkCharcoal: '#120f0e',
    darkGray: '#444',
    lightGray: '#c8c8c8',
    linkHover: '#06c',
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
