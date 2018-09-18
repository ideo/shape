import PropTypes from 'prop-types'
import styled from 'styled-components'

import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'

const FloatedPositioning = styled.div`
  bottom: 120px;
  height: 1px;
  max-width: calc(100% - 60px);
  position: fixed;
  z-index: ${v.zIndex.gridCardTop};
  width: 1300px;
`

const StyledButton = styled.button`
  background: ${v.colors.ctaButtonBlue};
  border-radius: 100%;
  color: white;
  float: right;
  height: 60px;
  width: 60px;

  svg {
    width: 50%;
  }
`

/** @component */
class FloatingActionButton extends React.Component {
  render() {
    const { icon, onClick, text, toolTip } = this.props
    return (
      <FloatedPositioning>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title={toolTip}
          placement="top"
        >
          <StyledButton onClick={onClick}>
            {icon}
            {text}
          </StyledButton>
        </Tooltip>
      </FloatedPositioning>
    )
  }
}
FloatingActionButton.propTypes = {
  toolTip: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  text: PropTypes.string,
  icon: PropTypes.node,
}

FloatingActionButton.defaultProps = {
  text: null,
  icon: null,
}

export default FloatingActionButton
