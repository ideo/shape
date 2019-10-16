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

class CommentThumbnail extends React.Component {
  objectLink() {
    const { threadRecord } = this.props

    if (threadRecord.internalType === 'collections') {
      return routingStore.pathTo('collections', threadRecord.id)
    } else if (threadRecord.internalType === 'items') {
      return routingStore.pathTo('items', threadRecord.id)
    }
    return routingStore.pathTo('homepage')
  }

  render() {
    const { subjectRecord, iconTop } = this.props
    let content
    const thumbnailStyle = {
      position: 'relative',
      top: `${iconTop}px`,
      left: '5px',
    }
    if (subjectRecord.internalType === 'items') {
      if (subjectRecord.type === ITEM_TYPES.TEXT) {
        content = (
          <div style={thumbnailStyle}>
            <TextIcon viewBox="-10 0 70 70" />
          </div>
        )
      } else {
        let imageSource = ''
        if (subjectRecord.thumbnail_url)
          imageSource = subjectRecord.thumbnail_url
        if (subjectRecord.filestack_file_url)
          imageSource = subjectRecord.filestack_file_url

        content = <img src={imageSource} alt={subjectRecord.name} />
      }
    } else {
      content = (
        <div style={thumbnailStyle}>
          <CollectionIcon viewBox="50 50 170 170" />
        </div>
      )
      if (subjectRecord.cover.image_url) {
        content = (
          <img src={subjectRecord.cover.image_url} alt={subjectRecord.name} />
        )
      }
    }
    return (
      <StyledLink to={this.objectLink()}>
        <ThumbnailHolder>{content}</ThumbnailHolder>
      </StyledLink>
    )
  }
}

CommentThumbnail.propTypes = {
  subjectRecord: MobxPropTypes.objectOrObservableObject.isRequired,
  threadRecord: MobxPropTypes.objectOrObservableObject.isRequired,
  iconTop: PropTypes.number,
}

CommentThumbnail.defaultProps = {
  iconTop: 1,
}

export default CommentThumbnail
