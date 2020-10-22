import PropTypes from 'prop-types'
import styled from 'styled-components'
import { SketchPicker } from 'react-color'

import v from '~/utils/variables'

const ColorPickerStyleWrapper = styled.div`
  .sketch-picker {
    font-family: ${v.fonts.sans};
  }
`
const ColorPicker = props => (
  <ColorPickerStyleWrapper>
    <SketchPicker
      color={props.color}
      onChangeComplete={props.onChangeComplete}
      presetColors={[
        { color: 'transparent', title: 'Transparent' },
        { color: 'red', title: 'Red' },
      ]}
    />
  </ColorPickerStyleWrapper>
)

ColorPicker.propTypes = {
  color: PropTypes.string.isRequired,
  onChangeComplete: PropTypes.func.isRequired,
}

export default ColorPicker
