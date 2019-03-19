import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction, observable } from 'mobx'

import trackError from '~/utils/trackError'
import DataItemCoverCollectionsItems from '~/ui/grid/covers/data-item/DataItemCoverCollectionsItems'
import DataItemCoverDisplayOnly from '~/ui/grid/covers/data-item/DataItemCoverDisplayOnly'

// eslint-disable-next-line react/no-multi-comp
@inject('apiStore')
@observer
class DataItemCover extends React.Component {
  @observable
  targetCollection = null

  componentDidMount() {
    const { collectionFilter } = this.props.item
    if (collectionFilter && collectionFilter.target) {
      this.loadTargetCollection(collectionFilter.target)
    }
  }

  async loadTargetCollection(target) {
    const { apiStore } = this.props
    try {
      const res = await apiStore.fetch('collections', target)
      runInAction(() => {
        this.targetCollection = res.data
      })
    } catch (e) {
      trackError(e)
    }
  }

  render() {
    const { item, card } = this.props
    if (item.isReportTypeCollectionsItems) {
      return <DataItemCoverCollectionsItems item={item} card={card} />
    }
    return <DataItemCoverDisplayOnly item={item} card={card} />
  }
}

DataItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  datasetLength: PropTypes.number,
}

DataItemCover.defaultProps = {
  datasetLength: 1,
}

DataItemCover.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default DataItemCover
