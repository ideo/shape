function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function () { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _templateObject3() {
  var data = _taggedTemplateLiteral(["\n  color: ", ";\n  transition: ", ";\n  &:hover {\n    cursor: pointer;\n    color: ", ";\n  }\n  display: inline-block;\n  height: 18px;\n  margin-right: 8px;\n  width: 12px;\n  vertical-align: middle;\n"]);

  _templateObject3 = function _templateObject3() {
    return data;
  };

  return data;
}

function _templateObject2() {
  var data = _taggedTemplateLiteral(["\n  margin-top: 0.5rem;\n  height: 1.2rem;\n  display: flex;\n  white-space: nowrap;\n  font-size: 1rem;\n  font-family: ", ";\n  font-weight: ", ";\n  color: ", ";\n  letter-spacing: 1.1px;\n  @media only screen and (max-width: ", "px) {\n    margin-top: 0;\n  }\n"]);

  _templateObject2 = function _templateObject2() {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = _taggedTemplateLiteral(["\n  height: 1.7rem;\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import v from '~/utils/variables';
import Tooltip from '~/ui/global/Tooltip';
import ArrowIcon from '~/ui/icons/ArrowIcon';
import BreadcrumbItem, { breadcrumbItemPropType } from '~/ui/layout/BreadcrumbItem';
var BreadcrumbPadding = styled.div(_templateObject());
BreadcrumbPadding.displayName = 'BreadcrumbPadding';
var StyledBreadcrumbWrapper = styled.div(_templateObject2(), v.fonts.sans, v.weights.book, v.colors.commonDark, v.responsive.medBreakpoint);
StyledBreadcrumbWrapper.displayName = 'StyledBreadcrumbWrapper';
var BackIconContainer = styled.span(_templateObject3(), v.colors.black, v.transition, v.colors.primaryDarkest);

var Breadcrumb = /*#__PURE__*/function (_React$Component) {
  _inherits(Breadcrumb, _React$Component);

  var _super = _createSuper(Breadcrumb);

  function Breadcrumb(props) {
    var _this;

    _classCallCheck(this, Breadcrumb);

    _this = _super.call(this, props);

    _this.totalNameLength = function (items) {
      if (!items) return 0;

      var sumby = _.sumBy(items, function (item) {
        var len = 0;
        if (item.ellipses) return 0;
        if (item.truncatedName && item.truncatedName.length) len = item.truncatedName.length;else if (item.name) len = item.name.length;
        return len;
      });

      return sumby;
    };

    _this.charsToTruncateForItems = function (items) {
      return _this.totalNameLength(items) - _this.maxChars;
    };

    _this.onRestoreBreadcrumb = function (item) {
      _this.props.onRestore(item);
    };

    _this.breadcrumbWrapper = props.breadcrumbWrapper;
    return _this;
  }

  _createClass(Breadcrumb, [{
    key: "transformToSubItems",
    value: function transformToSubItems(items) {
      var firstItem = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var lastItem = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var subItems = items.map(function (item, idx) {
        var subItem = _objectSpread({}, item);

        if (item.ellipses && item.id !== firstItem.id) item.remove = true;
        if (lastItem && item.id === lastItem.id) subItem.isEllipsesLink = true;
        subItem.nested = idx;
        return subItem;
      });
      return subItems;
    }
  }, {
    key: "addSubItems",
    value: function addSubItems(copyItems) {
      var maxDepth = this.props.maxDepth;

      if (maxDepth === 1) {
        var allItems = this.items();

        var _subItems = this.transformToSubItems(allItems, copyItems[0]);

        if (copyItems[0]) copyItems[0].subItems = _subItems;
      }

      var ellipsesItems = copyItems.filter(function (item) {
        return item.ellipses;
      });
      var subItems;

      if (ellipsesItems.length) {
        var firstEllipsesItem = ellipsesItems.shift();
        var lastEllipsesItem = ellipsesItems.pop();
        subItems = this.transformToSubItems(copyItems, firstEllipsesItem, lastEllipsesItem);
        firstEllipsesItem.subItems = subItems;
      } else {
        subItems = this.transformToSubItems(copyItems);
      }

      if (copyItems[0] && copyItems[0].identifier === 'homepage') {
        copyItems[0].subItems = subItems;
      }

      return copyItems;
    }
  }, {
    key: "renderBackButton",
    value: function renderBackButton() {
      var showBackButton = this.props.showBackButton;
      var item = this.previousItem;
      if (!showBackButton || !item) return null;
      return /*#__PURE__*/React.createElement("button", {
        onClick: this.props.onBack,
        "data-cy": "BreadcrumbBackButton"
      }, /*#__PURE__*/React.createElement(Tooltip, {
        title: item.name
      }, /*#__PURE__*/React.createElement(BackIconContainer, null, /*#__PURE__*/React.createElement(ArrowIcon, null))));
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var _this$props = this.props,
          breadcrumbItemComponent = _this$props.breadcrumbItemComponent,
          items = _this$props.items,
          isSmallScreen = _this$props.isSmallScreen,
          isTouchDevice = _this$props.isTouchDevice,
          onBreadcrumbDive = _this$props.onBreadcrumbDive;
      var renderItems = items.length > 0;
      var truncatedItems = this.truncatedItems; // We need a ref to wrapper so we always render that
      // Tried using innerRef on styled component but it isn't available on mount

      var BreadcrumbItemComponent = breadcrumbItemComponent || BreadcrumbItem;
      return /*#__PURE__*/React.createElement("div", {
        ref: this.breadcrumbWrapper
      }, !renderItems && /*#__PURE__*/React.createElement(BreadcrumbPadding, null), renderItems && /*#__PURE__*/React.createElement(StyledBreadcrumbWrapper, null, this.renderBackButton(), truncatedItems.map(function (item, index) {
        return /*#__PURE__*/React.createElement("span", {
          key: "".concat(item.name, "-").concat(index),
          style: {
            position: 'relative'
          }
        }, /*#__PURE__*/React.createElement(BreadcrumbItemComponent, {
          identifier: item.identifier,
          item: item,
          index: index,
          numItems: items.length,
          onBreadcrumbClick: _this2.props.onBreadcrumbClick,
          restoreBreadcrumb: function restoreBreadcrumb() {
            return _this2.onRestoreBreadcrumb(item);
          },
          onBreadcrumbDive: onBreadcrumbDive,
          isTouchDevice: isTouchDevice,
          isSmallScreen: isSmallScreen
        }));
      })));
    }
  }, {
    key: "previousItem",
    get: function get() {
      var items = this.props.items;

      if (items.length > 1) {
        return items[items.length - 2];
      }

      return null;
    }
  }, {
    key: "maxChars",
    get: function get() {
      var width = this.props.containerWidth;

      if (!width) {
        if (!this.breadcrumbWrapper.current) return 80;
        width = this.breadcrumbWrapper.current.offsetWidth;
      } // roughly .075 characters per pixel


      return _.round(width * 0.08);
    } // totalNameLength keeps getting called, with items potentially truncated

  }, {
    key: "truncatedItems",
    get: function get() {
      var items = this.props.items;

      var copyItems = _toConsumableArray(items); // The mobile menu should have the full breadcrumb trail in it's one item


      if (copyItems.length === 1) {
        return copyItems;
      }

      var charsLeftToTruncate = this.charsToTruncateForItems(copyItems); // If we are within allowable number of chars, return items

      if (charsLeftToTruncate <= 0) return copyItems; // Item names are still too long, show ... in place of their name
      // Start at the midpoint, floor-ing to favor adding ellipses farther up the breadcrumb

      var index = _.floor((copyItems.length - 1) / 2); // If event number of items, increment index first,
      // otherwise if odd, decrement first


      var increment = copyItems.length % 2 === 0;
      var jumpBy = 1;

      while (charsLeftToTruncate > 0) {
        var item = copyItems[index];
        if (!item) break;

        if (!item.ellipses) {
          // Subtract this item from chars to truncate
          charsLeftToTruncate -= item.truncatedName ? item.truncatedName.length : item.name.length; // Continue marking for truncation until we reduce it to be short enough

          item.ellipses = true; // clear out truncatedName so that just the ellipses is printed out

          item.truncatedName = null;
        } // Traverse on either side of midpoint


        index = increment ? index + jumpBy : index - jumpBy;
        jumpBy += 1;
        increment = !increment;
      }

      var modifiedItems = this.addSubItems(_toConsumableArray(copyItems));
      return _.reject(modifiedItems, {
        remove: true
      });
    }
  }]);

  return Breadcrumb;
}(React.Component);

Breadcrumb.propTypes = {
  /**
   * A list of breadcrumb items to display
   */
  items: PropTypes.arrayOf(PropTypes.shape(breadcrumbItemPropType)).isRequired,

  /**
   * Another component to wrap the whole breacrumb
   */
  breadcrumbWrapper: PropTypes.oneOfType([PropTypes.element, PropTypes.object]),

  /**
   * A component to wrap each breadcrumb item
   */
  breadcrumbItemComponent: PropTypes.node,

  /**
   * The action to take when going back in the breadcrumb UI
   */
  onBack: PropTypes.func.isRequired,

  /**
   * The action to take when diving into a sub breadcrumb
   */
  onBreadcrumbDive: PropTypes.func,

  /**
   * The action to take when restoring a breadcrumb (Shape specific)
   */
  onRestore: PropTypes.func,

  /**
   * The action to take when clicking on a breadcrumb, which is likely navigation
   * of some sort
   */
  onBreadcrumbClick: PropTypes.func,

  /**
   * The width of the parent container of the breadcrumb, used to limit it's size
   */
  containerWidth: PropTypes.number,

  /**
   * The maximum depth a breadcrumb sub menu can go
   */
  maxDepth: PropTypes.number,

  /**
   * Whether to show the back button at all
   */
  showBackButton: PropTypes.bool,

  /**
   * Visible hide the breadcrumb but ensure it still takes up space
   */
  visiblyHidden: PropTypes.bool,

  /**
   * Whether the current device is a touch device. Should be used to improve
   * the user experience.
   */
  isTouchDevice: PropTypes.bool,

  /**
   * Whether the current device is a phone size device. Should be used to improve
   * the user experience.
   */
  isSmallScreen: PropTypes.bool
};
Breadcrumb.defaultProps = {
  breadcrumbWrapper: React.createRef(),
  breadcrumbItemComponent: null,
  onRestore: function onRestore() {},
  onBreadcrumbClick: function onBreadcrumbClick() {},
  onBreadcrumbDive: null,
  containerWidth: null,
  maxDepth: 6,
  showBackButton: false,
  visiblyHidden: false,
  isTouchDevice: false,
  isSmallScreen: false
};
export default Breadcrumb;

//# sourceMappingURL=Breadcrumb.js.map