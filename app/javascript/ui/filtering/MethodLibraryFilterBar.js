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
import TagIcon from '~/ui/icons/TagIcon'

const ResponsiveFlex = styled(Flex)`
  flex-direction: row;
  flex-wrap: wrap;
  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    align-items: flex-start;
    flex-direction: column;
  }
`

const MethodCategoryWrapper = styled.div`
  flex-basis: auto;
  margin: 3px 0;
`

const MethodCategorySelect = styled.div`
  padding: 0 10px 0 10px;
  cursor: pointer;
  display: inline-block;
  .icon {
    vertical-align: middle;
    width: 25px;
    height: 25px;
  }
`

const MethodTagsWrapper = styled.div`
  display: inline-block;
  vertical-align: middle;
  min-height: 41px;
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

  selectFilter = filter => {
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
    const { methodLibraryTags } = this.props
    const categories = Object.keys(methodLibraryTags).filter(
      category => category !== 'creativeQualities'
    )
    return (
      <Fragment>
        <div style={{ marginTop: '6px' }}>
          <PillList itemList={this.formattedPills('creativeQualities')} />
        </div>
        <ResponsiveFlex>
          {categories.map(category => (
            <MethodCategoryWrapper key={category}>
              <PopoutMenu
                hideDotMenu
                checkboxMenu
                menuOpen={this.state.menuOpen === category}
                onMouseLeave={() => this.closeMenu(category)}
                menuItems={this.formattedPills(category).map(tag => ({
                  name: tag.name,
                  bgColor: tag.color || v.colors.commonLight,
                  isChecked: tag.selected,
                  iconLeft: <TagIcon />,
                  onClick: () => this.selectFilter(tag),
                }))}
                width={category === 'type' ? 200 : 300}
                offsetPosition={{ x: -5, y: 1 }}
              />
              <MethodCategorySelect
                onMouseEnter={() => this.openMenu(category)}
              >
                <DisplayText>{startCase(category)}</DisplayText>{' '}
                <DropdownIcon />
              </MethodCategorySelect>
              <MethodTagsWrapper>
                <PillList
                  itemList={this.formattedPills(category, true)}
                  onItemDelete={this.selectFilter}
                />
              </MethodTagsWrapper>
            </MethodCategoryWrapper>
          ))}
        </ResponsiveFlex>
      </Fragment>
    )
  }
}

MethodLibraryFilterBar.propTypes = {
  filters: MobxPropTypes.arrayOrObservableArray.isRequired,
  methodLibraryTags: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
}

export default MethodLibraryFilterBar
