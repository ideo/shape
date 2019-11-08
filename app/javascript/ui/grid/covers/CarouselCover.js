import PropTypes from 'prop-types'
import { computed, observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import CoverRenderer from '~/ui/grid/CoverRenderer'

@inject('apiStore')
@observer
class CarouselCover extends React.Component {
  @observable
  records = []
  @observable
  currentIdx

  componentDidMount() {
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

  render() {
    const { collection } = this.props
    console.log('render')
    if (!this.records.length > 0) return <div>Loading...</div>

    console.log('render', this.records, collection.collection_cover_items)

    return (
      <div style={{ color: 'black', height: '100%' }}>
        <CoverRenderer
          card={collection.parent_collection_card}
          cardType={'items'}
          record={this.currentCarouselRecord}
          dragging={this.props.dragging}
          textItemHideReadMore
        />
      </div>
    )
  }
}

CarouselCover.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  dragging: PropTypes.bool,
}

CarouselCover.defaultProps = {
  dragging: false,
}

export default CarouselCover
