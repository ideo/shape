import _ from 'lodash'
import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Box, Flex } from 'reflexbox'
import styled from 'styled-components'

import PillList from '~/ui/global/PillList'
import { SubduedText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import FilterIcon from '~/ui/icons/FilterIcon'
import { filtersToTags } from '~/ui/filtering/shared'

export const FilterIconHolder = styled.div`
  margin-top: 3px;
  height: 40px;
  width: 35px;
  color: ${v.colors.commonDark};
`
FilterIconHolder.displayName = 'FilterIconHolder'

@observer
class FilterBar extends React.Component {
  get formattedPills() {
    const { onSelect, filters } = this.props
    return filtersToTags({
      filters,
      onSelect,
    })
  }

  get anyFiltersSelected() {
    const { filters } = this.props
    return _.some(filters, 'selected')
  }

  render() {
    const {
      onDelete,
      onShowAll,
      totalResults,
      hideTotalResults,
      showIcon,
    } = this.props
    return (
      <Flex align="center">
        {showIcon && this.formattedPills.length > 0 && (
          <FilterIconHolder>
            <FilterIcon />
          </FilterIconHolder>
        )}
        <PillList itemList={this.formattedPills} onItemDelete={onDelete} />
        {_.isNumber(totalResults) &&
          !hideTotalResults &&
          this.anyFiltersSelected && (
            <Fragment>
              <Box mr={'25px'} ml={['8px', '8px', '8px']}>
                <SubduedText>
                  {totalResults} {totalResults === 1 ? 'Result' : 'Results'}
                </SubduedText>
              </Box>
              <Box ml={['8px', '8px', 0]}>
                <button onClick={onShowAll}>
                  <SubduedText>Show all</SubduedText>
                </button>
              </Box>
            </Fragment>
          )}
      </Flex>
    )
  }
}

FilterBar.propTypes = {
  filters: MobxPropTypes.arrayOrObservableArray.isRequired,
  totalResults: PropTypes.oneOfType([PropTypes.bool, PropTypes.number])
    .isRequired,
  onDelete: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onShowAll: PropTypes.func.isRequired,
  hideTotalResults: PropTypes.bool,
  showIcon: PropTypes.bool,
}

FilterBar.defaultProps = {
  hideTotalResults: false,
  showIcon: PropTypes.bool,
}

export default FilterBar
