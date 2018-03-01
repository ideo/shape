import { PropTypes as MobxPropTypes } from 'mobx-react'
import PaddedCardCover from './PaddedCardCover'

// This styling is really just a placeholder.
// CollectionCovers will eventually display differently than just showing the name
class CollectionCover extends React.PureComponent {
  render() {
    const { collection } = this.props
    return (
      <PaddedCardCover>
        {collection.name} (coll.)
      </PaddedCardCover>
    )
  }
}

CollectionCover.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionCover
