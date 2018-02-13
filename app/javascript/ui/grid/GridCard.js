import styled from 'styled-components'

import GridCardHotspots from '~/ui/grid/GridCardHotspots'
import DragHandle from '~/ui/grid/DragHandle'

export const StyledGridCard = styled.div`
  z-index: 1;
  height: 100%;
  width: 100%;
  background: white;
  padding: 0;

  &:hover {
    z-index: 2;
    .DragHandle {
      opacity: 1;
    }
  }
`

const StyledGridCardInner = styled.div`
  position: relative;
  padding: 1rem;
  height: calc(100% - 2rem);
  overflow: hidden;
`

class GridCard extends React.PureComponent {
  render() {
    const { card, record } = this.props

    return (
      <StyledGridCard className={this.props.className}>
        <GridCardHotspots {...this.props} />

        <DragHandle />

        <StyledGridCardInner>
          { record.name } { card.order }
        </StyledGridCardInner>
      </StyledGridCard>
    )
  }
}

export default GridCard
