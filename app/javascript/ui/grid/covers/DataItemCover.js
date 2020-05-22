import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { action, observable } from 'mobx'

import DataItemCoverCollectionsItems from '~/ui/grid/covers/data-item/DataItemCoverCollectionsItems'
import DataItemCoverDisplayOnly from '~/ui/grid/covers/data-item/DataItemCoverDisplayOnly'
import trackError from '~/utils/trackError'

// eslint-disable-next-line react/no-multi-comp
@inject('apiStore')
@observer
class DataItemCover extends React.Component {
  @observable
  targetCollection = null

  componentDidMount() {
    this.loadDatasets()
  }

  componentDidUpdate(prevProps) {
    const { item, datasetLength } = this.props
    if (!item.primaryDataset) {
      this.loadDatasets()
    } else if (datasetLength > prevProps.datasetLength) {
      this.loadDatasetTargetCollection()
    }
  }

  async loadDatasets() {
    const { item } = this.props
    if (!item.loadingDatasets) {
      await item.API_fetchDatasets()
    }
  }

  async loadDatasetTargetCollection() {
    const { item } = this.props
    if (!item.primaryDataset) return
    const { data_source_id, data_source_type } = item.primaryDataset
    if (data_source_id && data_source_type === 'Collection') {
      this.loadTargetCollection(data_source_id)
    }
  }

  @action
  setTargetCollection(collection) {
    this.targetCollection = collection
  }

  loadTargetCollection = async (id = null) => {
    const { apiStore } = this.props
    if (!id) {
      this.setTargetCollection(null)
      return
    }
    const found = apiStore.find('collections', id)
    if (found) {
      this.setTargetCollection(found)
      return
    }
    try {
      const res = await apiStore.fetch('collections', id)
      this.setTargetCollection(res.data)
    } catch (e) {
      trackError(e)
    }
  }

  render() {
    const { item, card } = this.props
    if (item.isReportTypeCollectionsItems) {
      return (
        <DataItemCoverCollectionsItems
          item={item}
          card={card}
          targetCollection={this.targetCollection}
          loadTargetCollection={this.loadTargetCollection}
        />
      )
    }
    return <DataItemCoverDisplayOnly item={item} card={card} />
  }
}

DataItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  datasetLength: PropTypes.number.isRequired,
}

DataItemCover.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default DataItemCover
