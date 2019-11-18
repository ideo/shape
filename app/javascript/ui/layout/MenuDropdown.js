// slightly based off: https://blog.lunarlogic.io/2018/slidedown-menu-in-react/
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { NavLink } from '~/ui/marketing/MarketingMenu'

const MenuList = styled.ul``
const MenuListItem = styled.li`
  position: relative;
  top: 5px;
`

const SubmenuList = styled.ul`
  display: none;
  position: absolute;
  ${MenuListItem}:hover & {
    display: block;
    background: rgb(255, 255, 255, 0.7);
  }
`
const SubmenuListItem = styled.li`
  padding: 12px 0 12px;
  :hover {
    border-bottom: 2px solid black;
  }
`

const DropdownSpacer = styled.li`
  padding: 5px;
`

class SubmenuDropdown extends React.Component {
  renderDropdownItems = item => {
    const { isHome, handleScrollToContent } = this.props
    const { label } = item
    const props =
      label === 'Overview'
        ? { onClick: () => handleScrollToContent(isHome) }
        : { href: '/product/feedback' }
    return (
      <SubmenuListItem>
        <NavLink {...props} key={label}>
          {label}
        </NavLink>
      </SubmenuListItem>
    )
  }

  render() {
    const { items } = this.props
    return (
      <SubmenuList>{items.map(i => this.renderDropdownItems(i))}</SubmenuList>
    )
  }
}

SubmenuDropdown.propTypes = {
  items: PropTypes.array.isRequired,
  isHome: PropTypes.bool.isRequired,
  handleScrollToContent: PropTypes.func.isRequired,
}

class MenuDropdown extends React.Component {
  render() {
    const { items, isHome, handleScrollToContent } = this.props

    return (
      <MenuList>
        <MenuListItem>
          <NavLink onClick={() => handleScrollToContent(isHome)}>
            Product
          </NavLink>
          <DropdownSpacer />
          <SubmenuDropdown
            items={items}
            isHome={isHome}
            handleScrollToContent={handleScrollToContent}
          />
        </MenuListItem>
      </MenuList>
    )
  }
}

MenuDropdown.propTypes = {
  items: PropTypes.array.isRequired,
  isHome: PropTypes.bool.isRequired,
  handleScrollToContent: PropTypes.func.isRequired,
}

export default MenuDropdown
