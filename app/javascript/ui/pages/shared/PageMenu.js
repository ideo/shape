import { Fragment } from 'react'
import PropTypes from 'prop-types'

import { uiStore } from '~/stores'
import ShareIcon from '~/ui/icons/ShareIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'
import TagEditor from '~/ui/pages/shared/TagEditor'

class PageMenu extends React.PureComponent {
  handleMouseLeave = () => {
    if (this.props.menuOpen) {
      uiStore.update('pageMenuOpen', false)
    }
  }

  toggleOpen = (e) => {
    e.stopPropagation()
    // const { uiStore } = this.props
    uiStore.update('pageMenuOpen', true)
  }

  showTags = () => {
    uiStore.update('tagsModalOpen', true)
  }

  get menuItems() {
    const items = [
      { name: 'Tags', icon: <ShareIcon />, onClick: this.showTags }
    ]
    return items
  }

  render() {
    // const { uiStore } = this.props
    return (
      <Fragment>
        <PopoutMenu
          onMouseLeave={this.handleMouseLeave}
          onClick={this.toggleOpen}
          menuItems={this.menuItems}
          menuOpen={this.props.menuOpen}
        />

        <TagEditor />
      </Fragment>
    )
  }
}

PageMenu.propTypes = {
  menuOpen: PropTypes.bool,
}
PageMenu.defaultProps = {
  menuOpen: false,
}

export default PageMenu
