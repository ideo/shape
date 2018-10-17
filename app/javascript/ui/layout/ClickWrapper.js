import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'

const StyledClickWrapper = styled.div`
  position: fixed;
  top: ${props => props.top}px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: ${v.zIndex.clickWrapper};
`
StyledClickWrapper.displayName = 'StyledClickWrapper'

class ClickWrapper extends React.Component {
  handleClick = e => {
    this.props.clickHandlers.forEach(clickHandler => {
      clickHandler(e)
    })
  }

  render() {
    return (
      <StyledClickWrapper
        top={this.props.top}
        onClick={this.handleClick}
        onContextMenu={this.props.onContextMenu}
      />
    )
  }
}

ClickWrapper.propTypes = {
  top: PropTypes.number,
  clickHandlers: PropTypes.arrayOf(PropTypes.func).isRequired,
  onContextMenu: PropTypes.func,
}
ClickWrapper.defaultProps = {
  top: 0,
  onContextMenu: () => null,
}

export default ClickWrapper
