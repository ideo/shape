import PropTypes from 'prop-types'
import { Box } from 'reflexbox'
import styled from 'styled-components'

import FilterIcon from '~/ui/icons/FilterIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'

export const FilterIconButton = styled.button`
  height: 40px;
  margin-right: 10px;
  margin-bottom: ${props => props.marginBottom}px;
  width: 35px;
`
FilterIconButton.displayName = 'FilterIconButton'

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
    const { marginBottom } = this.props

    return (
      <Box ml={'auto'}>
        <FilterIconButton
          marginBottom={marginBottom}
          onClick={this.handleFilterClick}
        >
          <FilterIcon />
        </FilterIconButton>
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
  marginBottom: PropTypes.number,
}

FilterMenu.defaultProps = {
  marginBottom: 24,
}

export default FilterMenu
