import MuiCheckbox from '@material-ui/core/Checkbox'
import styled from 'styled-components'

import v from '~/utils/variables'

// TODO duplicate of styled/forms
const Checkbox = styled(MuiCheckbox)`
  &.remove-padding {
    height: auto;
    margin-right: 0;
    vertical-align: middle;
    width: 28px;
  }

  &.checkbox--error {
    color: ${v.colors.alert};
  }
  &.checkbox--black {
    color: ${v.colors.black} !important;
  }
  &.checkbox--white,
  &.checkbox--checked-white {
    color: white !important;
  }
`
Checkbox.displayName = 'StyledCheckbox'
export default Checkbox
