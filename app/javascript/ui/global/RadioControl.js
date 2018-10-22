import PropTypes from 'prop-types'
import Radio from '@material-ui/core/Radio'
import RadioGroup from '@material-ui/core/RadioGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import styled from 'styled-components'

const StyledRadioGroup = styled(RadioGroup)`
  margin-bottom: 25px;
`

const StyledRadio = styled(Radio)`
  &.RadioRoot {
    height: 30px;
  }
`

const StyledFormControlLabel = styled(FormControlLabel)`
  .FormControlLabel {
    font-size: 1rem;
  }
`

class RadioControl extends React.PureComponent {
  render() {
    const { name, options, onChange, selectedValue } = this.props
    const formControls = options.map(option => (
      <StyledFormControlLabel
        classes={{ label: 'FormControlLabel' }}
        key={option.value}
        value={option.value}
        control={
          <StyledRadio
            disabled={option.disabled}
            classes={{ root: 'RadioRoot' }}
            color="primary"
          />
        }
        label={option.label}
        labelPlacement="end"
      />
    ))
    return (
      <StyledRadioGroup
        aria-label={name}
        name={name}
        value={selectedValue}
        onChange={onChange}
      >
        {formControls}
      </StyledRadioGroup>
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
