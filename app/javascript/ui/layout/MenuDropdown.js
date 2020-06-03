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
  width: 150%;
  ${MenuListItem}:hover & {
    display: block;
    background: rgb(255, 255, 255, 0.95);
  }
`
const SubmenuListItem = styled.li`
  display: flex;
  text-align: left;
  line-height: 16px;
  flex-direction: column;
  justify-content: center;
  :hover {
    box-shadow: 0 2px 0px 0px black;
  }
`

const FlexNavLink = styled(NavLink)`
  margin: 0px 0px 0px 24px;
  height: 100%;
  padding: 12px 0px;
  position: relative;
`

const DropdownSpacer = styled.ul`
  padding: 5px;
`

const renderDropdownItems = (item, isHome, handleScrollToContent) => {
  const { label, href } = item
  const props =
    label === 'Overview'
      ? { onClick: () => handleScrollToContent(isHome) }
      : { href }
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
        <NavLink
          className="NavLink"
          onClick={() => handleScrollToContent(isHome)}
        >
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

MenuDropdown.propTypes = {
  items: PropTypes.array.isRequired,
  isHome: PropTypes.bool.isRequired,
  handleScrollToContent: PropTypes.func.isRequired,
}

export default MenuDropdown
