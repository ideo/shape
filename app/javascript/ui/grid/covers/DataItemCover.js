import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction, observable } from 'mobx'

import trackError from '~/utils/trackError'
import DataItemCoverEditable from '~/ui/grid/covers/data-item/DataItemCoverEditable'
import DataItemCoverReadonly from '~/ui/grid/covers/data-item/DataItemCoverReadonly'

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
      return <DataItemCoverEditable item={item} card={card} />
    }
    return <DataItemCoverReadonly item={item} card={card} />
  }
}

DataItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
}

DataItemCover.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default DataItemCover
