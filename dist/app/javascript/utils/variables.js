"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.quillSelectors = exports.INITIAL_OFFSET_Y = exports.INITIAL_OFFSET_X = exports.TOUCH_DEVICE_OS = exports.EVENT_SOURCE_TYPES = exports.KEYS = exports.TEST_COLLECTION_SELECT_OPTIONS = exports.DATA_MEASURES = exports.DATASET_CHART_TYPES = exports.COLLECTION_CARD_TYPES = exports.COLLECTION_TYPES = exports.ITEM_TYPES = exports.AUDIENCE_PRICES = exports.FREEMIUM_USER_LIMIT = void 0;
// global vars from Rails application (or undefined, e.g. in a unit test)
var FREEMIUM_USER_LIMIT = window.FREEMIUM_USER_LIMIT || 5;
exports.FREEMIUM_USER_LIMIT = FREEMIUM_USER_LIMIT;
var AUDIENCE_PRICES = {
  MIN_NUM_PAID_QUESTIONS: window.AUDIENCE_PRICES && window.AUDIENCE_PRICES.MIN_NUM_PAID_QUESTIONS || 10,
  TEST_PRICE_PER_QUESTION: window.AUDIENCE_PRICES && window.AUDIENCE_PRICES.TEST_PRICE_PER_QUESTION || 0.12,
  TARGETED_AUDIENCE_MIN_PRICE_PER_RESPONSE: window.AUDIENCE_PRICES && window.AUDIENCE_PRICES.TARGETED_AUDIENCE_MIN_PRICE_PER_RESPONSE || 4.0
};
exports.AUDIENCE_PRICES = AUDIENCE_PRICES;
var ITEM_TYPES = {
  TEXT: 'Item::TextItem',
  FILE: 'Item::FileItem',
  VIDEO: 'Item::VideoItem',
  LINK: 'Item::LinkItem',
  QUESTION: 'Item::QuestionItem',
  CHART: 'Item::ChartItem',
  DATA: 'Item::DataItem',
  EXTERNAL_IMAGE: 'Item::ExternalImageItem',
  LEGEND: 'Item::LegendItem'
};
exports.ITEM_TYPES = ITEM_TYPES;
var COLLECTION_TYPES = {
  TEST: 'Collection::TestCollection',
  TEST_RESULTS: 'Collection::TestResultsCollection',
  TEST_DESIGN: 'Collection::TestDesign'
};
exports.COLLECTION_TYPES = COLLECTION_TYPES;
var COLLECTION_CARD_TYPES = {
  PRIMARY: 'CollectionCard::Primary',
  LINK: 'CollectionCard::Link',
  PLACEHOLDER: 'CollectionCard::Placeholder'
};
exports.COLLECTION_CARD_TYPES = COLLECTION_CARD_TYPES;
var DATASET_CHART_TYPES = {
  AREA: 'area',
  LINE: 'line',
  BAR: 'bar'
};
exports.DATASET_CHART_TYPES = DATASET_CHART_TYPES;
var DATA_MEASURES = [{
  name: 'Participants',
  value: 'participants'
}, {
  name: 'Viewers',
  value: 'viewers'
}, {
  name: 'Activity',
  value: 'activity'
}, {
  name: 'Content Use',
  value: 'content',
  tooltip: 'content activities'
}, {
  name: 'Collections',
  value: 'collections'
}, {
  name: 'Items',
  value: 'items'
}, {
  name: 'Collections & Items',
  value: 'records'
}];
exports.DATA_MEASURES = DATA_MEASURES;
var TEST_COLLECTION_SELECT_OPTIONS = [{
  values: [{
    value: '',
    label: 'select question type',
    sections: ['intro', 'ideas', 'outro']
  }]
}, {
  category: 'Idea Ratings',
  values: [{
    value: 'question_clarity',
    label: 'Clear',
    sections: ['ideas']
  }, {
    value: 'question_different',
    label: 'Different',
    sections: ['ideas']
  }, {
    value: 'question_excitement',
    label: 'Exciting',
    sections: ['ideas']
  }, {
    value: 'question_useful',
    label: 'Useful',
    sections: ['ideas']
  }]
}, {
  category: 'Customizable',
  values: [{
    value: 'question_category_satisfaction',
    label: 'Category Satisfaction',
    sections: ['intro']
  }, {
    value: 'question_open',
    label: 'Open Response',
    sections: ['intro', 'ideas', 'outro']
  }, {
    value: 'question_media',
    label: 'Photo/Video',
    // check on final AC...
    sections: ['intro', 'ideas', 'outro']
  }, {
    value: 'question_description',
    label: 'Text Block',
    sections: ['intro', 'ideas', 'outro']
  }, {
    value: 'question_single_choice',
    label: 'Single Choice',
    sections: ['intro', 'ideas', 'outro']
  }, {
    value: 'question_multiple_choice',
    label: 'Multiple Choice',
    sections: ['intro', 'ideas', 'outro']
  }]
}];
exports.TEST_COLLECTION_SELECT_OPTIONS = TEST_COLLECTION_SELECT_OPTIONS;
var KEYS = {
  ENTER: 13,
  ESC: 27
};
exports.KEYS = KEYS;
var EVENT_SOURCE_TYPES = {
  GRID_CARD: 'gridCard',
  AUDIENCE_SETTINGS: 'audienceSettings',
  PAGE_MENU: 'pageMenu',
  BCT_MENU: 'bctMenu',
  TEXT_EDITOR: 'textEditor'
};
exports.EVENT_SOURCE_TYPES = EVENT_SOURCE_TYPES;
var TOUCH_DEVICE_OS = {
  WINDOWS: 'Windows Phone',
  ANDROID: 'Android',
  IOS: 'iOS',
  UNKNOWN: 'Unknown'
}; // warning: don't change, modify component based offsets instead. see: clickUtils::calculatePopoutMenuOffset

exports.TOUCH_DEVICE_OS = TOUCH_DEVICE_OS;
var INITIAL_OFFSET_X = 20;
exports.INITIAL_OFFSET_X = INITIAL_OFFSET_X;
var INITIAL_OFFSET_Y = 90;
exports.INITIAL_OFFSET_Y = INITIAL_OFFSET_Y;
var quillSelectors = '.quill, .ql-close, .ql-toolbar, .ql-container, .ql-editor, .ql-clipboard, .quill-toolbar, .ql-formats, .ql-header, .ql-link, .ql-stroke';
exports.quillSelectors = quillSelectors;
var _default = {
  headerHeight: 50,
  maxWidth: 1320,
  containerPadding: {
    horizontal: 2
  },
  topScrollTrigger: 210,
  maxTitleLength: 144,
  maxButtonTextLength: 8,
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
    muiSmBreakpoint: 960
  },
  cardTiltDegrees: -5,
  // tilt left
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
    white: '#ffffff'
  },
  buttonSizes: {
    header: {
      width: 160,
      fontSize: 0.825
    }
  },
  iconSizes: {
    bct: 47
  },
  fonts: {
    baseSize: 16,
    sans: "'Gotham', sans-serif",
    serif: "'Sentinel', serif"
  },
  weights: {
    book: 400,
    medium: 500,
    bold: 700
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
    aboveVictoryChart: 100
  },
  quillDefaults: {
    formats: ['link', 'header', 'commentHighlight', 'commentHighlightResolved', 'highlight'],
    modules: {
      toolbar: null
    }
  },
  defaults: {
    video: {
      name: 'Video'
    }
  },
  defaultGridSettings: {
    // layout will track we are at "size 3" i.e. "small 4 cols" even though cols === 4
    layoutSize: 4,
    cols: 4,
    gutter: 14,
    gridW: 316,
    gridH: 250
  },
  smallGridSettings: {
    gutter: 14,
    gridW: 253,
    gridH: 200
  },
  commentScrollOpts: {
    containerId: 'ctc-content',
    bottom: 'ctc-bottom',
    delay: 0,
    duration: 350,
    smooth: true
  }
};
exports.default = _default;

//# sourceMappingURL=variables.js.map