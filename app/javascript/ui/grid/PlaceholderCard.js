import PropTypes from 'prop-types'
import color from 'color'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { StyledGridCardPrivate } from '~/ui/grid/shared'
import CardLoader from '~/ui/grid/loader/CardLoader'
import propShapes from '~/utils/propShapes'
import { getCollaboratorColor } from '~/utils/colorUtils'

class PlaceholderCard extends React.Component {
  componentDidMount() {
    const { warnBeforeLeaving } = this.props

    if (warnBeforeLeaving) {
      window.addEventListener('beforeunload', this.onBeforeUnload)
      window.addEventListener('unload', this.onUnload)
    }
  }

  componentDidUpdate(prevProps) {
    const { warnBeforeLeaving } = this.props
    if (warnBeforeLeaving) {
      // re-add event listener since we've removed it during unmount
      window.addEventListener('beforeunload', this.onBeforeUnload)
      window.addEventListener('unload', this.onUnload)
    }
  }

  componentWillUnmount() {
    const { warnBeforeLeaving } = this.props
    if (warnBeforeLeaving) {
      window.removeEventListener('beforeunload', this.onBeforeUnload)
      window.removeEventListener('unload', this.onUnload)
    }
  }

  onBeforeUnload = e => {
    e.preventDefault() // If you prevent default behavior in Mozilla Firefox prompt will always be shown
    // Chrome requires returnValue to be set
    e.returnValue = ''
  }

  onUnload = e => {
    this.cleanupPlaceholders()
  }

  cleanupPlaceholders() {
    const { card } = this.props
    const { id } = card

    // add encoding since request type is text/plain
    const params = new Blob([JSON.stringify({ placeholder_id: id })], {
      type: 'application/json; charset=UTF-8',
    })

    // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon
    navigator.sendBeacon('/api/v1/collection_cards/cleanup_placeholder', params)
  }

  render() {
    const { collaborator } = this.props

    const collaboratorColor = getCollaboratorColor(collaborator)
    const backgroundColor =
      collaboratorColor &&
      color(collaboratorColor)
        .alpha(0.3)
        .rgb()
        .toString()

    return (
      <StyledGridCardPrivate backgroundColor={backgroundColor}>
        <CardLoader collaborator={collaborator} />
      </StyledGridCardPrivate>
    )
  }
}

PlaceholderCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  warnBeforeLeaving: PropTypes.bool.isRequired,
  collaborator: PropTypes.shape(propShapes.collaborator),
}

PlaceholderCard.defaultProps = {
  collaborator: null,
}

export default PlaceholderCard
