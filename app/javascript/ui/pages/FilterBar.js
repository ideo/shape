import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Box, Flex } from 'reflexbox'

import PillList from '~/ui/global/PillList'
import SearchIconRight from '~/ui/icons/SearchIconRight'
import TagIcon from '~/ui/icons/TagIcon'
import { SubduedText } from '~/ui/global/styled/typography'

@observer
class FilterBar extends React.Component {
  get formattedPills() {
    const { filters } = this.props
    return filters.map(filter => ({
      id: filter.id,
      name: filter.text,
      icon: filter.filter_type === 'tag' ? <TagIcon /> : <SearchIconRight />,
      selectable: true,
      selected: filter.selected,
      onSelect: this.onTagSelect,
    }))
  }

  render() {
    const { onDelete, onShowAll } = this.props
    return (
      <Flex align="center">
        <PillList itemList={this.formattedPills} onItemDelete={onDelete} />
        <Box>
          <button onClick={onShowAll}>
            <SubduedText>Show all</SubduedText>
          </button>
        </Box>
      </Flex>
    )
  }
}

FilterBar.propTypes = {
  filters: MobxPropTypes.arrayOrObservableArray.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onShowAll: PropTypes.func.isRequired,
}

export default FilterBar
