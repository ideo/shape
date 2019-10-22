import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import _ from 'lodash'

import RequiredCollectionIcon from '~/ui/icons/RequiredCollectionIcon'
import FoamcoreBoardIcon from '~/ui/icons/FoamcoreBoardIcon'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import LinkedCollectionIcon from '~/ui/icons/LinkedCollectionIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
import PinnedIcon from '~/ui/icons/PinnedIcon'

import { Tooltip } from '@material-ui/core'
import v from '~/utils/variables'
import UnreadCount from '~/ui/threads/UnreadCount'
import HiddenIconButton from '../icons/HiddenIconButton'
import { apiStore, uiStore } from '~/stores/'

export const StyledIconsWrapper = styled.div`
  position: absolute;
  bottom: 0;
  left: 0.25rem;
  z-index: ${v.zIndex.gridCard};
  color: ${v.colors.commonMedium};
  height: 45px;
  display: flex;
`
StyledIconsWrapper.displayName = 'StyledIconsWrapper'

export const StyledIconWrapper = styled.div`
  width: 45px;
`
StyledIconWrapper.displayName = 'StyledIconWrapper'

/* LinkIcon (and HiddenIcon) appears larger than CollectionIcon so we need to make it smaller */
export const StyledSmallIconWrapper = styled.div`
  width: 18px;
  height: 18px;
  bottom: 0.75rem;
`
StyledSmallIconWrapper.displayName = 'StyledSmallIconWrapper'

const LockedPinnedCardIcon = () => (
  <Tooltip title="pinned" placement="top">
    <PinnedIcon className={'show-on-hover'} locked />
  </Tooltip>
)

const PinnedCardIcon = () => (
  <Tooltip title="pinned" placement="top">
    <PinnedIcon />
  </Tooltip>
)

const UnreadButton = styled.button`
  position: relative;
  ${props => props.hasNoOtherIcons && `left: 8px;`}
  top: 30%;
  height: 40%;
`

class BottomLeftCardIcons extends React.Component {
  handleUnreadIconClick = e => {
    e.preventDefault()

    const { record } = this.props
    apiStore.openCurrentThreadToCommentOn(record)
    uiStore.setReplyingToComment(record.last_unresolved_comment_id)
    return
  }

  get icons() {
    const { card, cardType, record } = this.props
    const icons = []

    if (card.isPinnedInTemplate) {
      icons.push(
        <StyledIconWrapper>
          <PinnedCardIcon />
        </StyledIconWrapper>
      )
    }

    if (cardType === 'collections') {
      if (card.link) {
        icons.push(
          <StyledIconWrapper>
            <LinkedCollectionIcon />
          </StyledIconWrapper>
        )
      } else if (record.isRequired) {
        const type = record.isMasterTemplate ? 'template' : 'collection'
        icons.push(
          <StyledIconWrapper>
            <Tooltip title={`required ${type}`} placement="top">
              <div>
                <RequiredCollectionIcon />
              </div>
            </Tooltip>
          </StyledIconWrapper>
        )
      } else if (record.isBoard) {
        icons.push(
          <StyledIconWrapper>
            <FoamcoreBoardIcon />
          </StyledIconWrapper>
        )
      } else {
        icons.push(
          <StyledIconWrapper>
            <CollectionIcon />
          </StyledIconWrapper>
        )
      }
    } else if (card.link) {
      // TODO: // Need to wrap this in a small wrapper
      icons.push(
        <StyledSmallIconWrapper>
          <LinkIcon />
        </StyledSmallIconWrapper>
      )
    }

    if (card.isPinnedAndLocked) {
      icons.push(
        <StyledIconWrapper>
          <LockedPinnedCardIcon card={card} />
        </StyledIconWrapper>
      )
    }

    if (
      record.is_private ||
      (record.isSubmission && record.submission_attrs.hidden)
    ) {
      // TODO: handle edgecase for size and children
      icons.push(
        <HiddenIconButton
          clickable={record.can_edit && record.is_private}
          size="lg" // What is this doing?
          record={record}
          IconWrapper={({ children }) => (
            <StyledSmallIconWrapper>{children}</StyledSmallIconWrapper>
          )}
        />
      )
    }

    const hasNoOtherIcons = _.isEmpty(icons)

    if (record.unresolved_count && record.unresolved_count > 0) {
      icons.push(
        <Tooltip title="Add comment" placement="top">
          <UnreadButton
            onClick={this.handleUnreadIconClick}
            hasNoOtherIcons={hasNoOtherIcons}
          >
            <UnreadCount count={record.unresolved_count} size={'large'} />
          </UnreadButton>
        </Tooltip>
      )
    }

    if (!icons) return []

    return icons
  }

  render() {
    return (
      // needs to handle the same click otherwise clicking the icon does nothing
      <StyledIconsWrapper>
        {this.icons.map((icon, index) => (
          <Fragment key={index}>{icon}</Fragment>
        ))}
      </StyledIconsWrapper>
    )
  }
}

BottomLeftCardIcons.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  cardType: PropTypes.string.isRequired,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default BottomLeftCardIcons
