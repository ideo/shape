export const ITEM_TYPES = {
  TEXT: 'Item::TextItem',
  IMAGE: 'Item::ImageItem',
}

export default {
  headerHeight: 170,

  grid: {
    cols: 4,
    gutter: 20,
    gridW: 312,
    gridH: 250,
  },

  colors: {
    placeholder: '#d6fffe',
    teal: '#00bfa3',
    cyan: '#c0dbde',
    cyanLight: '#f0f4f6',
    dark: '#120f0e',
    lightBrown: '#D8D4D2',
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
