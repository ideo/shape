import PropTypes from 'prop-types'
import { inject, observer, propTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

const StyledClickWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`
StyledClickWrapper.displayName = 'StyledClickWrapper'

@inject('uiStore')
@observer
class ClickWrapper extends React.Component {
  handleClick = () => {
    this.props.uiStore.closeCardMenuIfOpen()
  }

  render () {
    return (
      <StyledClickWrapper onClick={this.handleClick} />
    )
  }
}

ClickWrapper.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ClickWrapper
