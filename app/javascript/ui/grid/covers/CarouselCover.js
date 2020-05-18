import _ from 'lodash'
import PropTypes from 'prop-types'
import { action, observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CoverRenderer from '~/ui/grid/CoverRenderer'
import ArrowIcon from '~/ui/icons/ArrowIcon'
import InlineLoader from '~/ui/layout/InlineLoader'
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
  loading = true

  componentDidMount() {
    const { collection } = this.props
    // reset this on mount
    collection.setCarouselIdx(0)
    this.fetchCarouselCards()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.updatedAt !== this.props.updatedAt) {
      this.fetchCarouselCards()
    }
  }

  fetchCarouselCards = async () => {
    const { collection } = this.props
    try {
      const data = await collection.API_fetchCards()
      runInAction(() => {
        collection.collection_cover_items = _.compact(
          data.map(card => card.record)
        )
        this.loading = false
      })
      if (!data || data.length === 0) this.props.onEmptyCarousel()
    } catch {
      this.loading = false
      this.props.onEmptyCarousel()
    }
  }

  get currentIdx() {
    return this.props.collection.carouselIdx
  }

  get records() {
    const { collection } = this.props
    return collection.collection_cover_items || []
  }

  @action
  handleNavigate = (e, direction) => {
    // prevent normal grid click
    e.stopPropagation()
    const { collection } = this.props
    // capture non-observable int value
    let idx = parseInt(collection.carouselIdx)
    if (direction === -1 && idx === 0) {
      idx = this.records.length - 1
    } else if (direction === 1 && idx === this.records.length - 1) {
      idx = 0
    } else {
      idx += direction
    }
    collection.setCarouselIdx(idx)
  }

  render() {
    const { collection } = this.props
    const { currentCarouselRecord } = collection

    if (this.loading) return <InlineLoader />

    if (!this.records.length) return null
    if (!currentCarouselRecord) return null

    return (
      <div style={{ color: 'black', height: '100%' }}>
        <CoverRenderer
          card={collection.parent_collection_card}
          cardType={'items'}
          record={currentCarouselRecord}
          dragging={this.props.dragging}
          textItemHideReadMore
          textItemUneditable
        />
        <CarouselControl>
          <DisplayText color={v.colors.commonDark} data-cy="ItemCount">
            {this.currentIdx + 1} / {this.records.length}
          </DisplayText>
          <CarouselButton onClick={e => this.handleNavigate(e, -1)}>
            <ArrowIcon rotation={180} />
          </CarouselButton>
          <CarouselButton onClick={e => this.handleNavigate(e, 1)}>
            <ArrowIcon rotation={0} />
          </CarouselButton>
        </CarouselControl>
      </div>
    )
  }
}

CarouselCover.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  updatedAt: PropTypes.string.isRequired,
  dragging: PropTypes.bool,
  onEmptyCarousel: PropTypes.func,
}
CarouselCover.wrappedComponent.propTypes = {
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

CarouselCover.defaultProps = {
  dragging: false,
  onEmptyCarousel: () => {},
}
CarouselCover.displayName = 'CarouselCover'

export default CarouselCover
