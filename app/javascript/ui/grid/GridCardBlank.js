import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { StyledGridCard } from './GridCard'

const StyledGridCardBlank = StyledGridCard.extend`
  background: white;
  cursor: auto;
`

const StyledGridCardInner = styled.div`
  padding: 2rem;
`

@inject('routingStore', 'uiStore')
@observer
class GridCardBlank extends React.Component {
  closeBlankContentTool = () => {
    this.props.uiStore.closeBlankContentTool()
  }

  render() {
    return (
      <StyledGridCardBlank>
        <StyledGridCardInner>
          I&apos;m blank!

          <br />
          <button onClick={this.closeBlankContentTool}>
            &times;
          </button>
        </StyledGridCardInner>
      </StyledGridCardBlank>
    )
  }
}

GridCardBlank.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default GridCardBlank
