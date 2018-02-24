import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

export const StyledCard = styled.div`
  padding: 1rem;
`
// This styling is really just a placeholder.
// CollectionCovers will eventually display differently than just showing the name
class CollectionCover extends React.PureComponent {
  render() {
    const { collection } = this.props
    return (
      <StyledCard>
        {collection.name} (coll.)
      </StyledCard>
    )
  }
}

CollectionCover.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionCover
