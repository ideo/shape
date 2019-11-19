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

const DropdownSpacer = styled.ul`
  padding: 5px;
`

const renderDropdownItems = (item, isHome, handleScrollToContent) => {
  const { label } = item
  const props =
    label === 'Overview'
      ? { onClick: () => handleScrollToContent(isHome) }
      : { href: '/product/feedback' }
  return (
    <SubmenuListItem key={label}>
      <NavLink {...props}>{label}</NavLink>
    </SubmenuListItem>
  )
}

const SubmenuDropdown = ({ items, isHome, handleScrollToContent }) => {
  return (
    <SubmenuList>
      {items.map(item =>
        renderDropdownItems(item, isHome, handleScrollToContent)
      )}
    </SubmenuList>
  )
}

SubmenuDropdown.propTypes = {
  items: PropTypes.array.isRequired,
  isHome: PropTypes.bool.isRequired,
  handleScrollToContent: PropTypes.func.isRequired,
}

const MenuDropdown = ({ items, isHome, handleScrollToContent }) => {
  return (
    <MenuList>
      <MenuListItem>
        <NavLink onClick={() => handleScrollToContent(isHome)}>Product</NavLink>
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

MenuDropdown.propTypes = {
  items: PropTypes.array.isRequired,
  isHome: PropTypes.bool.isRequired,
  handleScrollToContent: PropTypes.func.isRequired,
}

export default MenuDropdown
