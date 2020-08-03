import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import _ from 'lodash'

import RequiredCollectionIcon from '~/ui/icons/RequiredCollectionIcon'
import FoamcoreBoardIcon from '~/ui/icons/collection_icons/FoamcoreBoardIcon'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import LinkedCollectionIcon from '~/ui/icons/LinkedCollectionIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
import PinnedIcon from '~/ui/icons/PinnedIcon'

import { Tooltip } from '@material-ui/core'
import v from '~/utils/variables'
import HiddenIconButton from '~/ui/global/HiddenIconButton'
import UnresolvedButton from '~/ui/global/UnresolvedButton'
import PinnedIconButton from '~/ui/global/PinnedIconButton'
import { apiStore } from '~/stores/'

export const StyledIconsWrapper = styled.div`
  position: absolute;
  bottom: 0;
  left: 0.25rem;
  z-index: ${v.zIndex.gridCard};
  color: ${v.colors.commonMedium};
  height: 45px;
  display: flex;
  height: 45px;
  display: flex;
  justify-content: center;
  align-items: center;
`
StyledIconsWrapper.displayName = 'StyledIconsWrapper'

export const StyledIconWrapper = styled.div`
  width: 45px;
`
StyledIconWrapper.displayName = 'StyledIconWrapper'

/* LinkIcon (and HiddenIcon) appears larger than CollectionIcon so we need to make it smaller */
export const StyledSmallIconWrapper = styled.div`
  width: ${props => (props.width ? props.width : 18)}px;
  height: 18px;
  bottom: 0.75rem;
`
StyledSmallIconWrapper.displayName = 'StyledSmallIconWrapper'

const LockedPinnedCardIcon = () => (
  <Tooltip title="pinned" placement="top">
    <PinnedIcon className={'show-on-hover'} locked />
  </Tooltip>
)

class BottomLeftCardIcons extends React.Component {
  handleUnreadIconClick = e => {
    e.preventDefault()
    const { record } = this.props
    apiStore.expandAndOpenThreadForRecord(record)
    const comment = apiStore.find('comments', record.last_unresolved_comment_id)
    comment.expandAndFetchReplies()
  }

  get icons() {
    const { card, cardType, record } = this.props
    const icons = []

    if (card.is_master_template_card) {
      icons.push(
        <PinnedIconButton
          card={card}
          IconWrapper={({ children }) => (
            <StyledIconWrapper>{children}</StyledIconWrapper>
          )}
        />
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
      } else if (record.isBigBoard) {
        icons.push(
          <StyledIconWrapper>
            <FoamcoreBoardIcon />
          </StyledIconWrapper>
        )
      } else if (!record.isCreativeDifferenceChartCover) {
        icons.push(
          <StyledIconWrapper>
            <CollectionIcon size="md" />
          </StyledIconWrapper>
        )
      }
    } else if (card.link) {
      icons.push(
        <StyledSmallIconWrapper width={45}>
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
        <UnresolvedButton
          record={record}
          onClick={this.handleUnreadIconClick}
          hasNoOtherIcons={hasNoOtherIcons}
          IconWrapper={({ children }) => (
            <StyledSmallIconWrapper>{children}</StyledSmallIconWrapper>
          )}
        ></UnresolvedButton>
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
