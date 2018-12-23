import { observable, action } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import VisibilitySensor from 'react-visibility-sensor'

import Loader from '~/ui/layout/Loader'

@observer
class GridCardPagination extends React.Component {
  unmounted = false
  @observable
  loading = false
  @observable
  visible = false

  componentWillUnmount() {
    this.unmounted = true
  }

  @action
  update(field, val) {
    this[field] = val
  }

  fetchNextCards = async () => {
    if (this.unmounted) return
    const { collection } = this.props
    if (!collection.hasMore) return
    this.update('loading', true)
    await collection.API_fetchNextCards()
    this.update('loading', false)
  }

  handleVisibilityChange = isVisible => {
    this.update('visible', isVisible)
    if (isVisible && !this.loading) {
      const { collection } = this.props
      if (!collection.hasMore) return
      this.fetchNextCards()
    }
  }

  render() {
    return (
      <VisibilitySensor
        partialVisibility
        scrollCheck
        intervalDelay={300}
        onChange={this.handleVisibilityChange}
      >
        <Loader size={60} containerHeight="100%" />
      </VisibilitySensor>
    )
  }
}

GridCardPagination.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default GridCardPagination
