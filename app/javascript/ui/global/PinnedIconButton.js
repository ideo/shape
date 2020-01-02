import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import Tooltip from '~/ui/global/Tooltip'
import PinnedIcon from '~/ui/icons/PinnedIcon'

const PinnedIconButton = ({ card, IconWrapper }) => {
  const onClick = () => {
    card.API_togglePin()
  }
  let wrappedIcon = (
    <Tooltip
      classes={{ tooltip: 'Tooltip' }}
      title={card.isPinned ? 'Unpin' : 'Pin'}
      placement="top"
    >
      <div onClick={onClick}>
        <PinnedIcon locked={card.isPinned} />
      </div>
    </Tooltip>
  )
  wrappedIcon = <IconWrapper>{wrappedIcon}</IconWrapper>
  return wrappedIcon
}

PinnedIconButton.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  IconWrapper: PropTypes.func,
}

export default PinnedIconButton
