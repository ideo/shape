import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'

const StyledClickWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: ${v.zIndex.clickWrapper};
`
StyledClickWrapper.displayName = 'StyledClickWrapper'

class ClickWrapper extends React.Component {
  handleClick = (e) => {
    this.props.clickHandlers.forEach(clickHandler => {
      clickHandler.call(e)
    })
  }

  render () {
    return (
      <StyledClickWrapper
        onClick={this.handleClick}
      />
    )
  }
}

ClickWrapper.propTypes = {
  clickHandlers: PropTypes.arrayOf(PropTypes.func).isRequired,
}

export default ClickWrapper
