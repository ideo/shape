export const ITEM_TYPES = {
  TEXT: 'Item::TextItem',
  IMAGE: 'Item::ImageItem',
  VIDEO: 'Item::VideoItem',
}

export default {
  headerHeight: 150,

  colors: {
    placeholder: '#d6fffe',
    teal: '#00bfa3',
    cyan: '#c0dbde',
    cyanLight: '#f0f4f6',
    darkCharcoal: '#120f0e',
    darkGray: '#444',
    linkHover: '#06c',
  },

  quillDefaults: {
    formats: ['link', 'size', 'list'],
    modules: {
      toolbar: [
        // size: false means "normal" i.e. no formatting
        [{ size: [false, 'large'] }],
        ['link'],
      ]
    }
  },
}
