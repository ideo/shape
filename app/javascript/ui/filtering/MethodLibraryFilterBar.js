import { startCase } from 'lodash'
import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'
import styled from 'styled-components'

import { DisplayText } from '~/ui/global/styled/typography'
import PopoutMenu from '~/ui/global/PopoutMenu'
import PillList from '~/ui/global/PillList'
import v from '~/utils/variables'
import DropdownIcon from '~/ui/icons/DropdownIcon'
import { filtersToTags } from '~/ui/filtering/shared'

const ResponsiveFlex = styled(Flex)`
  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    align-items: flex-start;
    flex-direction: column;
  }
`

const MethodCategorySelect = styled.div`
  margin-right: 30px;
  cursor: pointer;
  .icon {
    vertical-align: middle;
    width: 25px;
    height: 25px;
  }
`

@observer
class MethodLibraryFilterBar extends React.Component {
  state = {
    menuOpen: null,
  }

  formattedPills(type, onlySelected = false) {
    const { onSelect } = this.props
    return filtersToTags({
      filters: this.filtersForType(type, onlySelected),
      onSelect,
    })
  }

  filtersForType(type, onlySelected = false) {
    const { methodLibraryTags, filters } = this.props
    const tagNames = methodLibraryTags[type]
    const matchingFilters = filters.filter(filter =>
      tagNames.includes(filter.text.toLowerCase())
    )
    if (!onlySelected) return matchingFilters
    return matchingFilters.filter(filter => filter.selected)
  }

  selectFilter(filter) {
    const { onSelect } = this.props
    onSelect(filter)
  }

  openMenu(category) {
    this.setState({
      menuOpen: category,
    })
  }

  closeMenu(category) {
    this.setState({
      menuOpen: null,
    })
  }

  render() {
    const { onDelete } = this.props
    const categories = ['subquality', 'category', 'type']
    return (
      <ResponsiveFlex align="center">
        {categories.map(category => (
          <Fragment>
            <MethodCategorySelect onMouseEnter={() => this.openMenu(category)}>
              <DisplayText>{startCase(category)}</DisplayText> <DropdownIcon />
            </MethodCategorySelect>
            <PopoutMenu
              hideDotMenu
              menuOpen={this.state.menuOpen === category}
              onMouseLeave={() => this.closeMenu(category)}
              menuItems={this.formattedPills(category).map(filter => ({
                name: filter.name,
                bgColor: filter.color,
                onClick: () => this.selectFilter(filter),
              }))}
              offsetPosition={{ x: -160, y: -15 }}
            />
            <PillList
              itemList={this.formattedPills(category, true)}
              onItemDelete={onDelete}
            />
          </Fragment>
        ))}
      </ResponsiveFlex>
    )
  }
}

MethodLibraryFilterBar.propTypes = {
  filters: MobxPropTypes.arrayOrObservableArray.isRequired,
  methodLibraryTags: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
}

export default MethodLibraryFilterBar
