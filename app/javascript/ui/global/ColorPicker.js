import PropTypes from 'prop-types'
import styled from 'styled-components'
import { SketchPicker } from 'react-color'

import v from '~/utils/variables'

const ColorPickerStyleWrapper = styled.div`
  position: relative;
  z-index: ${v.zIndex.aboveClickWrapper};

  .sketch-picker {
    font-family: ${v.fonts.sans};
  }
`
const DEFAULT_COLORS = [
  '#FFFFFF',
  '#FFD6A5',
  '#C7CBF0',
  '#D6D4DF',
  '#FACFD2',
  '#FDF7AE',
  '#CEE2D7',
]

const ColorPicker = props => (
  <ColorPickerStyleWrapper>
    <SketchPicker
      color={props.color}
      disableAlpha={props.disableAlpha}
      onChange={props.onChange}
      onChangeComplete={props.onChangeComplete}
      presetColors={[
        { color: 'transparent', title: 'Transparent' },
        ...DEFAULT_COLORS,
      ]}
    />
  </ColorPickerStyleWrapper>
)

ColorPicker.propTypes = {
  color: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  disableAlpha: PropTypes.bool,
  onChange: PropTypes.func,
  onChangeComplete: PropTypes.func,
}

ColorPicker.defaultProps = {
  disableAlpha: false,
  onChange: () => {},
  onChangeComplete: () => {},
}

export default ColorPicker
