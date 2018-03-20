import { Fragment } from 'react'
import PropTypes from 'prop-types'

import { uiStore } from '~/stores'
import ShareIcon from '~/ui/icons/ShareIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'
import TagEditor from '~/ui/pages/shared/TagEditor'

class PageMenu extends React.PureComponent {
  handleMouseLeave = () => {
    // const { uiStore } = this.props
    if (this.props.menuOpen) {
      uiStore.closePageMenu()
    }
  }

  toggleOpen = (e) => {
    e.stopPropagation()
    // const { uiStore } = this.props
    uiStore.togglePageMenuOpen()
  }

  showTags = () => {
    console.log('show tags')
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
