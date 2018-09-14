import { PropTypes as MobxPropTypes } from 'mobx-react'
import ContainImageIcon from '~/ui/icons/ContainImageIcon'
import styled from 'styled-components'

import Tooltip from '~/ui/global/Tooltip'

const ButtonWrapper = styled.button`
  height: 27px;
  width: 27px;
`
ButtonWrapper.displayName = 'ButtonWrapper'

class ContainImage extends React.Component {
  toggleSelected = ev => {
    ev.preventDefault()
    const { card } = this.props
    card.image_contain = !card.image_contain
    card.save()
  }

  render() {
    const { card } = this.props
    const { image_contain } = card

    return (
      <Tooltip
        classes={{ tooltip: 'Tooltip' }}
        title={!image_contain ? 'show whole image' : 'fill tile with image'}
        placement="top"
      >
        <ButtonWrapper className="show-on-hover" onClick={this.toggleSelected}>
          <ContainImageIcon />
        </ButtonWrapper>
      </Tooltip>
    )
  }
}

ContainImage.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
}

// to override the long 'injected-xxx' name
ContainImage.displayName = 'ContainImage'

export default ContainImage
