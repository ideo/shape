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
  '#A85751',
  '#DEA895',
  '#D6C3C9',
  '#AE8CA3',
  '#8B83A2',
  '#929E9E',
  '#84AF99',
  '#88B6C6',
  '#5473A6',
  '#DBD3D1',
  '#C2BBB9',
  '#A1A6B4',
  '#738091',
  '#454545',
  '#F2F1EE',
]

const ColorPicker = props => (
  <ColorPickerStyleWrapper>
    <SketchPicker
      color={props.color}
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
  onChange: PropTypes.func,
  onChangeComplete: PropTypes.func,
}

ColorPicker.defaultProps = {
  onChange: () => {},
  onChangeComplete: () => {},
}

export default ColorPicker
