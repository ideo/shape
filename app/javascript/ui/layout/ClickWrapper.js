import PropTypes from 'prop-types'
import { inject, propTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

const StyledClickWrapper = styled.div`
  height: 100vh;
`
StyledClickWrapper.displayName = 'StyledClickWrapper'

@inject('uiStore')
class ClickWrapper extends React.PureComponent {
  handleClick = () => {
    this.props.uiStore.closeCardMenuIfOpen()
  }

  render () {
    const { children } = this.props
    return (
      <StyledClickWrapper onClick={this.handleClick}>
        { children }
      </StyledClickWrapper>
    )
  }
}

ClickWrapper.propTypes = {
  children: PropTypes.node.isRequired,
}

ClickWrapper.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ClickWrapper
