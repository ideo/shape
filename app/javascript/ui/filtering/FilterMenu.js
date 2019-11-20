import PropTypes from 'prop-types'
import { Box } from 'reflexbox'
import styled from 'styled-components'

import FilterIcon from '~/ui/icons/FilterIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'

export const FilterIconHolder = styled.div`
  height: 40px;
  margin-right: 10px;
  ${props =>
    props.filterBarActive
      ? `
      margin-top: 5px;
    `
      : `
      margin-bottom: 12px;
      margin-top: -24px;
    `}
  width: 35px;
`
FilterIconHolder.displayName = 'FilterIconHolder'

class FilterMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      filterDropdownOpen: false,
    }
  }

  handleFilterClick = ev => {
    this.setState({
      filterDropdownOpen: !this.state.filterDropdownOpen,
    })
  }

  byTag = ev => {
    this.setState({
      filterDropdownOpen: false,
    })
    this.props.onFilterByTag()
  }

  bySearch = ev => {
    this.setState({
      filterDropdownOpen: false,
    })
    this.props.onFilterBySearch()
  }

  render() {
    const { isFilterBarActive } = this.props

    return (
      <Box ml={'auto'}>
        <FilterIconHolder filterBarActive={isFilterBarActive}>
          <button onClick={this.handleFilterClick}>
            <FilterIcon />
          </button>
        </FilterIconHolder>
        <PopoutMenu
          hideDotMenu
          menuOpen={this.state.filterDropdownOpen}
          menuItems={[
            {
              name: 'Filter by Tag',
              onClick: this.byTag,
            },
            {
              name: 'Filter by Search Term',
              onClick: this.bySearch,
            },
          ]}
          offsetPosition={{ x: -160, y: -38 }}
        />
      </Box>
    )
  }
}

FilterMenu.propTypes = {
  onFilterByTag: PropTypes.func.isRequired,
  onFilterBySearch: PropTypes.func.isRequired,
  isFilterBarActive: PropTypes.bool,
}

FilterMenu.defaultProps = {
  isFilterBarActive: false,
}

export default FilterMenu
