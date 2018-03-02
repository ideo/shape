import { PropTypes as MobxPropTypes } from 'mobx-react'
import StyledCover from './StyledCover'

// This styling is really just a placeholder.
// CollectionCovers will eventually display differently than just showing the name
class CollectionCover extends React.PureComponent {
  render() {
    const { collection } = this.props
    return (
      <StyledCover>
        {collection.name} (coll.)
      </StyledCover>
    )
  }
}

CollectionCover.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionCover
