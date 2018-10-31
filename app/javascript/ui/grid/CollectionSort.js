import MenuItem from '@material-ui/core/MenuItem'
import styled from 'styled-components'

import { Select } from '~/ui/global/styled/forms'
import { DisplayText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'

const StyledGrid = styled.div``
StyledGrid.displayName = 'StyledGrid'

const ExplanationText = DisplayText.extend`
  color: ${v.colors.commonMedium};
`

class CollectionSort extends React.Component {
  get sortingItems() {
    // TODO replace these with real data
    const { opts } = this
    if (opts) return opts
    return [
      { name: 'Created date', value: 'created_at' },
      { name: 'Last updated', value: 'updated_at' },
      { name: 'Result: Usesfullness', value: 'question_useful' },
      { name: 'Result: Exciting', value: 'question_exciting' },
    ]
  }

  handleSortChange = ev => {
    ev.preventDefault()
  }

  render() {
    return (
      <div>
        <ExplanationText>sort by: </ExplanationText>
        <Select
          classes={{ root: 'select', selectMenu: 'selectMenu' }}
          displayEmpty
          disableUnderline
          name="CollectionSort"
          onChange={this.handleSortChange}
          value={this.sortingItems[0].value}
        >
          {this.sortingItems.map(item => (
            <MenuItem key={item.name} value={item.value}>
              {item.name}
            </MenuItem>
          ))}
        </Select>
      </div>
    )
  }
}

CollectionSort.propTypes = {}
CollectionSort.defaultProps = {}

export default CollectionSort
