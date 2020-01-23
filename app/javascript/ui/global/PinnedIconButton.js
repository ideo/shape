import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import Tooltip from '~/ui/global/Tooltip'
import PinnedIcon from '~/ui/icons/PinnedIcon'

const PinnedIconButton = ({ card, IconWrapper }) => {
  const onClick = () => {
    card.API_togglePin()
  }
  const tooltipText = card.isPinned ? 'Unpin from Template' : 'Pin to Template'
  let wrappedIcon = (
    <Tooltip
      classes={{ tooltip: 'Tooltip' }}
      title={tooltipText}
      placement="top"
    >
      <div onClick={onClick} data-cy={`CardAction-${tooltipText}`}>
        <PinnedIcon locked={false} pinnedFromMasterTemplate={card.isPinned} />
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
