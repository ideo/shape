import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import GridCardHotspot from '~/ui/grid/GridCardHotspot'
import TextItem from '~/ui/items/TextItem'
import ImageItem from '~/ui/items/ImageItem'

export const StyledGridCard = styled.div`
  z-index: 1;
  height: 100%;
  width: 100%;
  background: white;
  padding: 0;
  cursor: ${props => (props.dragging ? 'grabbing' : 'pointer')};
`
StyledGridCard.displayName = 'StyledGridCard'

const StyledGridCardInner = styled.div`
  position: relative;
  height: 100%;
  overflow: hidden;
`
StyledGridCardInner.displayName = 'StyledGridCardInner'

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
      switch (record.type) {
      case 'Item::TextItem':
        return <TextItem item={record} />
      case 'Item::ImageItem':
        return <ImageItem item={record} />
      default:
        return (
          <div>
            {record.name} [{card.order}]
          </div>
        )
      }
    } else if (this.isCollection) {
      return (
        <div>
          {record.name} (coll.) [{card.order}]
        </div>
      )
    }
    return <div />
  }

  handleClick = () => {
    if (this.props.dragging) return
    this.props.handleClick()
  }

  render() {
    return (
      <StyledGridCard dragging={this.props.dragging}>
        <GridCardHotspot card={this.props.card} dragging={this.props.dragging} />
        {/* onClick placed here so it's separate from hotspot click */}
        <StyledGridCardInner onClick={this.handleClick}>
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
  dragging: PropTypes.bool.isRequired,
  handleClick: PropTypes.func.isRequired,
}

export default GridCard
