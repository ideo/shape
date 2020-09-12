import { StyledGridCardPrivate, CardLoader } from '~/ui/grid/shared'
import { PropTypes as MobxPropTypes } from 'mobx-react'

class PlaceholderCard extends React.Component {
  componentDidMount() {
    window.addEventListener('beforeunload', this.onBeforeUnload)
    window.addEventListener('onunload', this.onUnload)
  }
  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onBeforeUnload)
    window.removeEventListener('onunload', this.onUnload)
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon
  onBeforeUnload = e => {
    e.preventDefault() // If you prevent default behavior in Mozilla Firefox prompt will always be shown
    // Chrome requires returnValue to be set
    e.returnValue = ''
    this.cleanupPlaceholders()
  }

  onUnload = e => {
    this.cleanupPlaceholders()
  }

  cleanupPlaceholders() {
    const { card } = this.props
    const { id } = card

    const params = new Blob([JSON.stringify({ placeholder_id: id })], {
      type: 'application/json; charset=UTF-8',
    }) // the blob

    navigator.sendBeacon('/api/v1/collection_cards/cleanup_placeholder', params)
  }

  render() {
    return (
      <StyledGridCardPrivate>
        <CardLoader />
      </StyledGridCardPrivate>
    )
  }
}

PlaceholderCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default PlaceholderCard
