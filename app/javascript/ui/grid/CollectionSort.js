import _ from 'lodash'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import MenuItem from '@material-ui/core/MenuItem'
import styled from 'styled-components'

import { Select } from '~/ui/global/styled/forms'
import { DisplayText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import { questionTitle } from '~/ui/test_collections/shared'

const StyledGrid = styled.div``
StyledGrid.displayName = 'StyledGrid'

const ExplanationText = DisplayText.extend`
  color: ${v.colors.commonMedium};
`

@inject('uiStore')
@observer
class CollectionSort extends React.Component {
  get sortingItems() {
    const { collection } = this.props
    const opts = [
      { name: 'Created date', value: 'created_at' },
      { name: 'Last updated', value: 'updated_at' },
    ]
    _.each(collection.sort_options, opt => {
      opts.push({
        name: `Result: ${questionTitle(opt)}`,
        value: opt,
      })
    })
    return opts
  }

  handleSortChange = async ev => {
    ev.preventDefault()
    const { collection, uiStore } = this.props
    uiStore.update('collectionCardSortOrder', ev.target.value)
    await collection.API_sortCards()
  }

  render() {
    const { uiStore } = this.props
    const value = uiStore.collectionCardSortOrder

    return (
      <div>
        <ExplanationText>sort by: </ExplanationText>
        <Select
          classes={{ root: 'select', selectMenu: 'selectMenu' }}
          displayEmpty
          disableUnderline
          name="CollectionSort"
          onChange={this.handleSortChange}
          value={value}
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

CollectionSort.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}
CollectionSort.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionSort
