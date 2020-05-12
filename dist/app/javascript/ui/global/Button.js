function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _templateObject() {
  var data = _taggedTemplateLiteral(["\n  background-color: ", ";\n  border-color: ", ";\n  border-style: solid;\n  border-width: 1px;\n  border-radius: 20px;\n  color: ", ";\n  cursor: pointer;\n  font-family: ", ";\n  font-size: ", "rem;\n  font-weight: ", ";\n  height: 40px;\n  letter-spacing: 0.09375rem;\n  min-width: ", "px;\n  text-transform: uppercase;\n  transition: all 0.3s;\n  width: 183px;\n\n  &:hover,\n  &:focus {\n    background-color: ", ";\n    color: ", ";\n    border-color: ", ";\n  }\n  ", ";\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import v from '~/utils/variables';
var StyledButton = styled.button(_templateObject(), function (_ref) {
  var colorScheme = _ref.colorScheme,
      outline = _ref.outline;
  var color = outline ? v.colors.transparent : colorScheme;

  if (colorScheme === v.colors.white) {
    // Note: add background color for white colorScheme to be visible
    color = "rgba(0, 0, 0, 0.15)";
  }

  return color;
}, function (_ref2) {
  var colorScheme = _ref2.colorScheme;
  return "".concat(colorScheme);
}, function (_ref3) {
  var colorScheme = _ref3.colorScheme,
      outline = _ref3.outline;
  return outline ? colorScheme : v.colors.white;
}, v.fonts.sans, function (_ref4) {
  var size = _ref4.size;
  return size === 'sm' ? 0.75 : 1;
}, v.weights.medium, function (_ref5) {
  var minWidth = _ref5.minWidth;
  return minWidth;
}, v.colors.commonDark, v.colors.white, v.colors.commonDark, function (props) {
  return props.disabled && "background-color: transparent;\n      pointer-events: none;\n      border: 1px solid ".concat(v.colors.commonMedium, ";\n      color:  ").concat(v.colors.commonMedium, ";\n    ");
});
/**
 * The base button
 *
 * @component
 */

var Button = function Button(props) {
  return /*#__PURE__*/React.createElement(StyledButton, props, props.children);
};

Button.displayName = 'Button';
Button.propTypes = {
  /**
   * The color scheme of the button which can be the outline button or any
   * of the colors
   */
  colorScheme: PropTypes.oneOf([].concat(_toConsumableArray(Object.values(v.colors)), ['transparent'])),

  /** The size of mainly the text in the button */
  size: PropTypes.oneOf(['sm', 'md']),

  /**
   * Set a minimum width for the button if it's supposed to be a certain size
   */
  minWidth: PropTypes.number,

  /** Disable the button from being clicked, also rendering a disabled style */
  disabled: PropTypes.bool,

  /** Outline */
  outline: PropTypes.bool
};
Button.defaultProps = {
  colorScheme: v.colors.black,
  size: 'md',
  minWidth: null,
  disabled: false,
  outline: false
};
/** @component */

export default Button;

//# sourceMappingURL=Button.js.map