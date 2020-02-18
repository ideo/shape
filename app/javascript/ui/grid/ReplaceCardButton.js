import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import styled from 'styled-components'

import Tooltip from '~/ui/global/Tooltip'
import Button from '~/ui/global/Button'
import { Checkbox } from '~/ui/global/styled/forms'
import v from '~/utils/variables'

const CenteredContainer = styled.div`
  background-color: ${props =>
    props.removeBackground ? 'rgba(255, 255, 255, 0.6)' : 'none'};
  border-radius: 6px;
  left: calc(50% - 105px);
  padding: 20px 15px 0;
  position: absolute;
  text-align: center;
  top: calc(50% - 50px);
  width: 180px;
  z-index: ${v.zIndex.gridCardTop};
`

const StyledFormControlLabel = styled(FormControlLabel)`
  .form-control {
    font-size: 1rem;
    font-weight: 300;
    margin-right: 20px;
  }
`

class ReplaceCardButton extends React.PureComponent {
  handleReplace = ev => {
    const { card } = this.props
    if (card.is_master_template_card) return false
    ev.preventDefault()
    return card.beginReplacing()
  }

  handleReplaceToggle = ev => {
    const { card } = this.props
    card.show_replace = ev.target.checked
    card.save()
  }

  render() {
    const { card, showControls } = this.props

    return (
      <CenteredContainer removeBackground={card.is_master_template_card}>
        <Button
          colorScheme={v.colors.alert}
          disabled={!card.show_replace}
          onClick={this.handleReplace}
        >
          Replace
        </Button>
        {card.is_master_template_card && showControls && (
          <Tooltip
            classes={{ tooltip: 'Tooltip' }}
            title={`${
              card.show_replace ? "don't show" : 'show'
            } the Replace button`}
            placement="bottom"
          >
            <StyledFormControlLabel
              classes={{ label: 'form-control' }}
              style={{ textAlign: 'center' }}
              control={
                <Checkbox
                  classes={{
                    root: 'checkbox--black',
                  }}
                  checked={card.show_replace}
                  onChange={this.handleReplaceToggle}
                  value="yes"
                />
              }
              label="Show"
            />
          </Tooltip>
        )}
      </CenteredContainer>
    )
  }
}

ReplaceCardButton.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  showControls: PropTypes.bool,
}

ReplaceCardButton.defaultProps = {
  showControls: false,
}

export default ReplaceCardButton
