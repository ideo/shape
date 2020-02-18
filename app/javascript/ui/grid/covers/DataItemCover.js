import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import DataItemCoverCollectionsItems from '~/ui/grid/covers/data-item/DataItemCoverCollectionsItems'
import DataItemCoverDisplayOnly from '~/ui/grid/covers/data-item/DataItemCoverDisplayOnly'

// eslint-disable-next-line react/no-multi-comp
@inject('apiStore')
@observer
class DataItemCover extends React.Component {
  componentDidMount() {
    const { item } = this.props
    item.API_fetchDatasets()
  }

  componentDidUpdate() {
    const { item } = this.props
    if (!item.primaryDataset) {
      item.API_fetchDatasets()
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
