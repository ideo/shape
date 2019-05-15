import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { observer } from 'mobx-react'
import AutosizeInput from 'react-input-autosize'

import v from '~/utils/variables'
import styled from 'styled-components'
import { StyledRowFlexParent, StyledRowFlexCell } from './styled'
import { DisplayText } from '~/ui/global/styled/typography'

const EditableInput = styled(AutosizeInput)`
  width: 2rem;
  border-bottom: 1px solid ${v.colors.black};

  input {
    width: 2rem;
    background: transparent;
    border: 0;
    padding: 2px 3px;
    margin: -1px 0px -1px 0px;
    font-family: ${v.fonts.sans};
    font-size: 1rem;
    color: ${v.colors.black};
    &:focus {
      outline: 0;
    }
    &::placeholder {
      color: ${v.colors.commonDark};
    }
  }
`
EditableInput.displayName = 'EditableInput'

@observer
class TableBody extends React.Component {
  handleInputChange = ev => {
    const { audience, onInputChange } = this.props

    onInputChange(audience.id, ev.target.value)
  }

  render() {
    const { audience, sampleSize, selected, handleKeyPress } = this.props
    const textColor = selected ? v.colors.black : v.colors.commonMedium
    const selectedWithPrice = audience.price_per_response && selected

    return (
      <StyledRowFlexParent>
        <StyledRowFlexCell>
          <DisplayText color={textColor}>
            <strong>
              {selectedWithPrice
                ? `$${audience.price_per_response.toFixed(2)}`
                : '–'}
            </strong>
          </DisplayText>
        </StyledRowFlexCell>
        <StyledRowFlexCell>
          {selectedWithPrice ? (
            <EditableInput
              id={audience.id}
              type="text"
              placeholder="–"
              value={sampleSize}
              onChange={this.handleInputChange}
              onKeyPress={handleKeyPress}
            />
          ) : (
            <DisplayText color={v.colors.commonMedium}>–</DisplayText>
          )}
        </StyledRowFlexCell>
        <StyledRowFlexCell>
          <DisplayText color={textColor}>
            <strong>
              {sampleSize > 0 && selected
                ? `$${(audience.price_per_response * sampleSize).toFixed(2)}`
                : '–'}
            </strong>
          </DisplayText>
        </StyledRowFlexCell>
      </StyledRowFlexParent>
    )
  }
}

TableBody.propTypes = {
  audience: MobxPropTypes.objectOrObservableObject.isRequired,
  sampleSize: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  handleKeyPress: PropTypes.func.isRequired,
  onInputChange: PropTypes.func.isRequired,
}

export default TableBody
