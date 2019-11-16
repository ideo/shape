// slightly based off: https://blog.lunarlogic.io/2018/slidedown-menu-in-react/
import PropTypes from 'prop-types'
import styled from 'styled-components'
import v from '~/utils/variables'
import { browserHistory } from '~/ui/MarketingRoutes'
import { scroller } from 'react-scroll'

const MenuList = styled.ul``
const MenuListItem = styled.li``

const SubmenuList = styled.ul`
  display: none;
  position: absolute;
  padding-top: 12px;
  ${MenuListItem}:hover & {
    display: block;
    background: rgb(255, 255, 255, 0.7);
  }
`
const SubmenuListItem = styled.li`
  padding: 12px 0 12px;
`

const DropdownLink = styled.a`
  font-weight: ${v.weights.medium};
  font-family: ${v.fonts.sans};
  font-size: 12px;
  letter-spacing: 0.4px;
  color: black;
  margin: 1em;
  padding: 6px 12px;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer
}
`

class SubmenuDropdown extends React.Component {
  handleScrollToContent(isHome) {
    if (!isHome) {
      browserHistory.push('/')
      return
    }
    scroller.scrollTo('ContentAnchor', {
      duration: 1500,
      delay: 100,
      smooth: true,
      offset: 0,
    })
  }

  renderDropdownItems = item => {
    const { isHome } = this.props
    const { label } = item
    const props =
      label === 'Overview'
        ? { onClick: () => this.handleScrollToContent(isHome) }
        : { href: '/product/feedback' }
    return (
      <SubmenuListItem>
        <DropdownLink {...props} key={label}>
          {label}
        </DropdownLink>
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
}

class MenuDropdown extends React.Component {
  render() {
    const { items, isHome } = this.props

    return (
      <MenuList>
        <MenuListItem>
          <DropdownLink>Product</DropdownLink>
          <SubmenuDropdown items={items} isHome={isHome} />
        </MenuListItem>
      </MenuList>
    )
  }
}

MenuDropdown.propTypes = {
  items: PropTypes.array.isRequired,
  isHome: PropTypes.bool.isRequired,
}

export default MenuDropdown
