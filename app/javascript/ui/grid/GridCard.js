import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

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
  get isItem() {
    return this.props.cardType === 'items'
  }
  get isCollection() {
    return this.props.cardType === 'collections'
  }

  get inner() {
    const { card, record } = this.props
    if (this.isItem) {
      return (
        <div>
          {record.name} {card.order}
        </div>
      )
    } else if (this.isCollection) {
      return (
        <Link to={`/collections/${record.id}`}>
          {record.name} {card.order}
        </Link>
      )
    }
    return <div />
  }

  render() {
    return (
      <StyledGridCard>
        <GridCardHotspots card={this.props.card} />

        <DragHandle />

        <StyledGridCardInner>
          {this.inner}
        </StyledGridCardInner>
      </StyledGridCard>
    )
  }
}

GridCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  cardType: PropTypes.string.isRequired,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default GridCard
