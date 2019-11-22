// slightly based off: https://blog.lunarlogic.io/2018/slidedown-menu-in-react/
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { NavLink } from '~/ui/global/styled/marketing'

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
    background: rgb(255, 255, 255, 0.95);
  }
`
const SubmenuListItem = styled.li`
  padding: 12px 0 12px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: left;
  line-height: 16px;
  width: 180px;
  :hover {
    box-shadow: 0 2px 0px 0px black;
  }
`

const FlexNavLink = styled(NavLink)`
  flex-grow: 1;
  width: 100%;
`

const DropdownSpacer = styled.ul`
  padding: 5px;
`

const renderDropdownItems = (item, isHome, handleScrollToContent) => {
  const { label, href } = item
  const props =
    label === 'Overview'
      ? { onClick: () => handleScrollToContent(isHome) }
      : { href: href }
  return (
    <SubmenuListItem key={label}>
      <FlexNavLink {...props}>{label}</FlexNavLink>
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
