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
    }))
  }

  onDelete = ev => {
    console.log('dete', ev)
  }

  handleShowAll = ev => {
    console.log('dete', ev)
  }

  render() {
    return (
      <Flex align="center">
        <PillList itemList={this.formattedPills} onItemDelete={this.onDelete} />
        <Box>
          <button onClick={this.handleShowAll}>
            <SubduedText>Show all</SubduedText>
          </button>
        </Box>
      </Flex>
    )
  }
}

FilterBar.propTypes = {
  filters: MobxPropTypes.arrayOrObservableArray,
  canEdit: PropTypes.bool,
}

FilterBar.defaultProps = {
  filters: [],
  canEdit: false,
}

export default FilterBar
