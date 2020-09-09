import { StyledGridCardPrivate, CardLoader } from '~/ui/grid/shared'
import { PropTypes as MobxPropTypes } from 'mobx-react'

class PlaceholderCard extends React.Component {
  componentDidMount() {
    window.addEventListener('beforeunload', this.onBeforeUnload)
  }
  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onBeforeUnload)
  }

  onBeforeUnload = e => {
    e.preventDefault() // If you prevent default behavior in Mozilla Firefox prompt will always be shown
    // Chrome requires returnValue to be set
    e.returnValue = ''
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
