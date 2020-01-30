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
import { uiStore } from '~/stores'
import TagIcon from '~/ui/icons/TagIcon'
import {
  methodLibraryTagsByType,
  creativeQualities,
} from '~/utils/creativeDifferenceVariables'

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
  display: flex;
  flex-direction: row;
  align-items: center;
  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    align-items: flex-start;
    flex-direction: column;
  }
`

const MethodCategorySelect = styled.div`
  padding: 0 10px 0 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  .icon {
    width: 25px;
    height: 25px;
  }
  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    padding-top: 5px;
    padding-bottom: 5px;
  }
`

const MethodTagsWrapper = styled.div`
  flex: 1;
`

const CreativeQualityTypography = styled(Heading3)`
  margin-bottom: 0;
`

const CreativeQualityTagsWrapper = styled.div`
  margin-top: 6px;
  display: flex;
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
    const { filters } = this.props
    let tagNames
    if (type === 'creativeQualities') {
      tagNames = [...creativeQualities.keys()]
    } else if (type === 'subqualities') {
      tagNames = [...creativeQualities.values()]
        .map(val => val.subqualities)
        .flat()
    } else {
      tagNames = methodLibraryTagsByType[type]
    }
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
      const { filters, onSelect } = this.props
      let tags = []
      creativeQualities.forEach((data, quality) => {
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

  popoutMenuCoords(category) {
    if (uiStore.isMobile) {
      return {
        width: screen.width - 40,
        offsetPosition: {
          x: -10,
          y: -4,
        },
      }
    } else {
      return {
        width: category === 'type' ? 200 : 300,
        offsetPosition: {
          x: -10,
          y: -19,
        },
      }
    }
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

  toggleMenu(category) {
    const { menuOpen } = this.state
    if (menuOpen === category) {
      this.closeMenu(category)
    } else {
      this.openMenu(category)
    }
  }

  render() {
    const categories = ['subqualities', 'categories', 'types']
    return (
      <Fragment>
        <CreativeQualityTagsWrapper>
          <PillList itemList={this.formattedPills('creativeQualities')} />
        </CreativeQualityTagsWrapper>
        <ResponsiveFlex>
          {categories.map(category => (
            <MethodCategoryWrapper key={category}>
              <PopoutMenu
                hideDotMenu
                menuOpen={this.state.menuOpen === category}
                onMouseLeave={() => this.closeMenu(category)}
                menuItems={this.popoutMenuItems(category)}
                width={this.popoutMenuCoords(category).width}
                offsetPosition={this.popoutMenuCoords(category).offsetPosition}
              />
              <MethodCategorySelect
                onMouseEnter={() => this.openMenu(category)}
                onClick={() => this.toggleMenu(category)}
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
  onSelect: PropTypes.func.isRequired,
}

export default MethodLibraryFilterBar
