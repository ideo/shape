import _ from 'lodash'
import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Box, Flex } from 'reflexbox'
import styled from 'styled-components'

import PillList from '~/ui/global/PillList'
import { SubduedText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import { filtersToTags } from '~/ui/filtering/shared'

const ResponsiveFlex = styled(Flex)`
  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    align-items: flex-start;
    flex-direction: column;
  }
`

@observer
class FilterBar extends React.Component {
  get formattedPills() {
    const { onSelect, filters } = this.props
    return filtersToTags({
      filters,
      onSelect: onSelect,
    })
  }

  get anyFiltersSelected() {
    const { filters } = this.props
    return _.some(filters, 'selected')
  }

  render() {
    const { onDelete, onShowAll, totalResults } = this.props
    return (
      <ResponsiveFlex align="center">
        <PillList itemList={this.formattedPills} onItemDelete={onDelete} />
        {_.isNumber(totalResults) && this.anyFiltersSelected && (
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
      </ResponsiveFlex>
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
}

export default FilterBar
