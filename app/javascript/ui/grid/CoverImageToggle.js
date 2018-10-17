import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CoverImageToggleIcon from '~/ui/icons/CoverImageToggleIcon'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'

const StyledCoverImageToggle = styled.div`
  display: inline-block;
  height: 26px;
  width: 14px;
  svg {
    fill: ${props =>
      props.isCoverImage ? v.colors.black : v.colors.commonMedium};
  }
`
StyledCoverImageToggle.displayName = 'StyledCoverImageToggle'

@observer
class CoverImageToggle extends React.Component {
  toggle = e => {
    const { card, onReassign } = this.props
    card.is_cover = !card.is_cover
    card.save()
    if (card.is_cover) onReassign()
  }

  render() {
    const { card } = this.props
    return (
      <Tooltip
        classes={{ tooltip: 'Tooltip' }}
        title={card.is_cover ? 'remove as cover image' : 'make cover image'}
        placement="top"
      >
        <StyledCoverImageToggle
          className="show-on-hover"
          onClick={this.toggle}
          role="button"
          isCoverImage={card.is_cover}
        >
          <CoverImageToggleIcon />
        </StyledCoverImageToggle>
      </Tooltip>
    )
  }
}

CoverImageToggle.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  onReassign: PropTypes.func.isRequired,
}

export default CoverImageToggle
