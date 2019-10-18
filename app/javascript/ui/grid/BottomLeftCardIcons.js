import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

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

export const StyledIconsWrapper = styled.div`
  position: absolute;
  bottom: 0;
  left: 0.25rem;
  z-index: ${v.zIndex.gridCard};
  color: ${v.colors.commonMedium};
  ${'' /*  change this since we will determine width by icons rendered */}
  width: ${props => (props.iconAmount === 2 ? 75 : 45)}px;
  height: 45px;
  display: flex;
`
StyledIconsWrapper.displayName = 'StyledIconsWrapper'

export const StyledIconWrapper = styled.div`
  /* LinkIcon appears larger than CollectionIcon so we need to make it smaller */
  ${props =>
    props.small &&
    `
    width: 18px;
    height: 18px;
    bottom: 0.75rem;
    ${'' /*  change this since we will determine position by icons rendered */}
    left: ${props.iconPos === 2 ? 3.25 : 0.75}rem;
  `};
`
StyledIconWrapper.displayName = 'StyledIconWrapper'

// SmallStyledIconWrapper for link and hidden icons

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

const UnreadCountCardIcon = ({ count }) => (
  <Tooltip title="Add Comment" placement="bottom">
    <UnreadCount count={count} />
  </Tooltip>
)
UnreadCountCardIcon.propTypes = {
  count: PropTypes.number.isRequired,
}

class CardIcon extends React.Component {
  get icons() {
    const { card, cardType, record } = this.props
    const icons = []

    if (card.isPinnedInTemplate) {
      icons.push(<PinnedCardIcon />)
    }

    if (cardType === 'collections') {
      if (card.link) {
        icons.push(<LinkedCollectionIcon />)
      } else if (record.isRequired) {
        const type = record.isMasterTemplate ? 'template' : 'collection'
        icons.push(
          <Tooltip title={`required ${type}`} placement="top">
            <div>
              <RequiredCollectionIcon />
            </div>
          </Tooltip>
        )
      } else if (record.isBoard) {
        icons.push(<FoamcoreBoardIcon />)
      } else {
        icons.push(<CollectionIcon />)
      }
    } else if (card.link) {
      // TODO: // Need to wrap this in a small wrapper
      icons.push(<LinkIcon />)
    }

    if (card.isPinnedAndLocked) {
      icons.push(<LockedPinnedCardIcon card={card} />)
    }

    if (
      record.is_private ||
      (record.isSubmission && record.submission_attrs.hidden)
    ) {
      // TODO: handle edgecase for size and children
      icons.push(
        <HiddenIconButton
          clickable={record.can_edit && record.is_private}
          size="sm"
          record={record}
          IconWrapper={({ children }) => (
            // Need to wrap this in a small wrapper
            <StyledIconWrapper>{children}</StyledIconWrapper>
          )}
        />
      )
    }

    if (!icons) return []

    return icons
  }

  render() {
    return (
      // needs to handle the same click otherwise clicking the icon does nothing
      <StyledIconsWrapper>
        {this.icons.map((icon, index) => {
          return (
            <StyledIconWrapper key={`icon-${index}`}>{icon}</StyledIconWrapper>
          )
        })}
      </StyledIconsWrapper>
    )
  }
}

CardIcon.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  cardType: PropTypes.string.isRequired,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CardIcon
