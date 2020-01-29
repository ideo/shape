import { startCase } from 'lodash'
import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'
import styled from 'styled-components'

import { DisplayText, Heading3 } from '~/ui/global/styled/typography'
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

const CreativeQualityTypography = styled(Heading3)`
  margin-bottom: 0;
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
    const {
      filters,
      methodLibraryTagCategories,
      methodLibraryTagCategories: { creativeQualities },
    } = this.props
    let tagNames
    if (type === 'creativeQualities') {
      tagNames = [...creativeQualities.keys()]
    } else if (type === 'subqualities') {
      tagNames = [...creativeQualities.values()]
        .map(val => val.subqualities)
        .flat()
    } else {
      tagNames = methodLibraryTagCategories[type]
    }
    const matchingFilters = filters.filter(filter =>
      tagNames.includes(filter.text.toLowerCase())
    )
    if (!onlySelected) return matchingFilters
    return matchingFilters.filter(filter => filter.selected)
  }

  tagToMenuItem(tag) {
    return {
      name: tag.name,
      bgColor: tag.color || v.colors.commonLight,
      hasCheckbox: true,
      isChecked: tag.selected,
      iconLeft: <TagIcon />,
      onClick: () => this.selectFilter(tag),
    }
  }

  popoutMenuItems(category) {
    if (category === 'subqualities') {
      const { methodLibraryTagCategories, filters, onSelect } = this.props
      let tags = []
      methodLibraryTagCategories.creativeQualities.forEach((data, quality) => {
        tags.push({
          name: quality,
          bgColor: data.color,
          noHover: true,
          borderColor: v.colors.black,
          TextComponent: CreativeQualityTypography,
          onClick: () => null,
        })
        const subqualityFilters = filters.filter(filter =>
          data.subqualities.includes(filter.text.toLowerCase())
        )
        const subqualityTags = filtersToTags({
          filters: subqualityFilters,
          onSelect,
        })
        tags = [...tags, ...subqualityTags.map(tag => this.tagToMenuItem(tag))]
      })
      return tags
    } else {
      return this.formattedPills(category).map(tag => this.tagToMenuItem(tag))
    }
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
    const categories = ['subqualities', 'categories', 'types']
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
                menuOpen={this.state.menuOpen === category}
                onMouseLeave={() => this.closeMenu(category)}
                menuItems={this.popoutMenuItems(category)}
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
  methodLibraryTagCategories: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
}

export default MethodLibraryFilterBar
