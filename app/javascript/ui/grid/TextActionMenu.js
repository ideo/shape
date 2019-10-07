import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import CommentIcon from '../icons/CommentIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'

@inject('uiStore', 'apiStore')
@observer
class TextActionMenu extends React.Component {
  get menuItems() {
    const actions = [
      {
        name: 'Comment',
        iconRight: <CommentIcon />,
        onClick: this.addComment,
      },
    ]

    return actions
  }

  addComment = async () => {
    const { apiStore, card } = this.props
    const { record } = card

    apiStore.openCurrentThreadToCommentOn(record)
  }

  handleMouseLeave = () => {
    const { uiStore } = this.props
    uiStore.closeCardMenu()
  }

  render() {
    const { uiStore, card } = this.props

    return (
      <PopoutMenu
        hideDotMenu
        menuOpen={uiStore.textMenuOpenForCard(card.id)}
        menuItems={this.menuItems}
        onMouseLeave={this.handleMouseLeave}
        position={{
          x: uiStore.cardMenuOpen.x,
          y: uiStore.cardMenuOpen.y,
        }}
        offsetPosition={{
          x: uiStore.cardMenuOpen.offsetX,
          y: uiStore.cardMenuOpen.offsetY,
        }}
        width={250}
      />
    )
  }
}

TextActionMenu.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  offsetPosition: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
}

TextActionMenu.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

TextActionMenu.defaultProps = {
  offsetPosition: null,
}

TextActionMenu.displayName = 'TextActionMenu'

export default TextActionMenu
