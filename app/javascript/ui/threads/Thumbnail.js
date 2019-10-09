import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { routingStore } from '~/stores'
import styled from 'styled-components'
import Link from '~/ui/global/Link'
import TextIcon from '~/ui/icons/TextIcon'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import { ITEM_TYPES } from '~/utils/variables'

const StyledLink = styled(Link)`
  margin-right: 8px;
`
export const ThumbnailHolder = styled.span`
  display: block;
  flex-shrink: 0;
  height: 50px;
  width: 50px;
  img,
  svg {
    flex-shrink: 0;
    height: 100%;
    object-fit: cover;
    width: 100%;
  }
`
ThumbnailHolder.displayName = 'ThumbnailHolder'

class Thumbnail extends React.Component {
  objectLink() {
    const { record } = this.props

    if (record.internalType === 'collections') {
      return routingStore.pathTo('collections', record.id)
    } else if (record.internalType === 'items') {
      return routingStore.pathTo('items', record.id)
    }
    return routingStore.pathTo('homepage')
  }

  render() {
    const { record, iconTop } = this.props
    let content
    const thumbnailStyle = {
      position: 'relative',
      top: `${iconTop}px`,
      left: '5px',
    }
    if (record.internalType === 'items') {
      if (record.type === ITEM_TYPES.TEXT) {
        content = (
          <div style={thumbnailStyle}>
            <TextIcon viewBox="-10 0 70 70" />
          </div>
        )
      } else {
        content = <img src={record.filestack_file_url} alt="Text" />
      }
    } else {
      content = (
        <div style={thumbnailStyle}>
          <CollectionIcon viewBox="50 50 170 170" />
        </div>
      )
      if (record.cover.image_url) {
        content = <img src={record.cover.image_url} alt={record.name} />
      }
    }
    return (
      <StyledLink to={this.objectLink()}>
        <ThumbnailHolder>{content}</ThumbnailHolder>
      </StyledLink>
    )
  }
}

Thumbnail.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  iconTop: PropTypes.number,
}

Thumbnail.defaultProps = {
  record: null,
  iconTop: 1,
}

export default Thumbnail
