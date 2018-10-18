import PropTypes from 'prop-types'
import Radio from '@material-ui/core/Radio'
import RadioGroup from '@material-ui/core/RadioGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
// import { withStyles } from '@material-ui/core/styles'

// import v from '~/utils/variables'

class RadioControl extends React.PureComponent {
  render() {
    const { name, options, onChange, selectedValue } = this.props
    const formControls = options.map(option => (
      <FormControlLabel
        key={option.value}
        value={option.value}
        control={<Radio color="primary" />}
        label={option.label}
        labelPlacement="end"
      />
    ))
    return (
      <RadioGroup
        aria-label={name}
        name={name}
        value={selectedValue}
        onChange={onChange}
      >
        {formControls}
      </RadioGroup>
    )
  }
}

RadioControl.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node,
      value: PropTypes.string,
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  selectedValue: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
}
RadioControl.displayName = 'RadioControl'

export default RadioControl
