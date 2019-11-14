import PropTypes from 'prop-types'
import { action, computed, observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CoverRenderer from '~/ui/grid/CoverRenderer'
import ArrowIcon from '~/ui/icons/ArrowIcon'
import { DisplayText } from '~/ui/global/styled/typography'
import { TextEnterButton } from '~/ui/test_collections/shared'
import v from '~/utils/variables'

const CarouselControl = styled.div`
  align-items: center;
  bottom: 12px;
  display: flex;
  justify-content: space-between;
  min-width: 125px;
  position: absolute;
  right: 12px;
  z-index: ${v.zIndex.gridCardTop};
`

const CarouselButton = styled(TextEnterButton)`
  bottom: 14px;
  position: static;
  height: 32px;
  width: 32px;

  &:hover {
    border-color: ${v.colors.commonDark};
    border-style: solid;
    border-width: 2px;
    color: ${v.colors.commonDark};
  }
`

@inject('routingStore')
@observer
class CarouselCover extends React.Component {
  @observable
  records = []
  @observable
  currentIdx = 0

  constructor(props) {
    super(props)

    const { collection } = this.props
    const items = collection.collection_cover_items

    runInAction(() => {
      this.records = items
      this.currentIdx = 0
    })
  }

  @computed
  get currentCarouselRecord() {
    return this.records[this.currentIdx]
  }

  @action
  handleNavigate = direction => {
    if (direction === -1 && this.currentIdx === 0) {
      this.currentIdx = this.records.length - 1
      return
    }
    if (direction === 1 && this.currentIdx === this.records.length - 1) {
      this.currentIdx = 0
      return
    }
    this.currentIdx += direction
  }

  handleClick = ev => {
    ev.preventDefault()
    ev.stopPropagation()
    const { collection, routingStore } = this.props
    routingStore.routeTo('collections', collection.id)
  }

  render() {
    const { collection } = this.props

    if (!this.currentCarouselRecord) return null

    return (
      <div style={{ color: 'black', height: '100%' }}>
        <CoverRenderer
          card={collection.parent_collection_card}
          cardType={'items'}
          record={this.currentCarouselRecord}
          dragging={this.props.dragging}
          handleClick={this.handleClick}
          textItemHideReadMore
          textItemUneditable
        />
        <CarouselControl>
          <DisplayText color={v.colors.commonDark} data-cy="ItemCount">
            {this.currentIdx + 1} / {this.records.length}
          </DisplayText>
          <CarouselButton onClick={() => this.handleNavigate(-1)}>
            <ArrowIcon rotation={180} />
          </CarouselButton>
          <CarouselButton onClick={() => this.handleNavigate(1)}>
            <ArrowIcon rotation={0} />
          </CarouselButton>
        </CarouselControl>
      </div>
    )
  }
}

CarouselCover.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  dragging: PropTypes.bool,
}
CarouselCover.wrappedComponent.propTypes = {
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

CarouselCover.defaultProps = {
  dragging: false,
}
CarouselCover.displayName = 'CarouselCover'

export default CarouselCover
