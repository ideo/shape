import PropTypes from 'prop-types'
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

  async fetchNextPage() {
    const { collection, nextPage } = this.props
    if (!this.loading) {
      if (!collection.hasMore) return
      this.update('loading', true)
      await collection.API_fetchCards({ page: nextPage })
      this.update('loading', false)
    }
  }

  handleVisibilityChange = isVisible => {
    this.update('visible', isVisible)
    if (isVisible) {
      this.fetchNextPage()
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
  nextPage: PropTypes.number.isRequired,
}

export default GridCardPagination
