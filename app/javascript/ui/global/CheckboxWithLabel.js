import _ from 'lodash'
import PropTypes from 'prop-types'

import { Checkbox, LabelContainer } from '~/ui/global/styled/forms'

const CheckboxWithLabel = ({ onChange, checked, label }) => (
  <LabelContainer
    labelPlacement={'end'}
    control={
      <Checkbox
        // this class is really just for cypress purposes
        classes={{ root: _.kebabCase(`checkbox-${label}`) }}
        onChange={onChange}
        checked={checked}
      />
    }
    label={<div style={{ maxWidth: '582px', paddingTop: '9px' }}>{label}</div>}
  ></LabelContainer>
)

CheckboxWithLabel.propTypes = {
  onChange: PropTypes.func.isRequired,
  checked: PropTypes.bool,
  label: PropTypes.string.isRequired,
}
CheckboxWithLabel.defaultProps = {
  checked: false,
}

export default CheckboxWithLabel
