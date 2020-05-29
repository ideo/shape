import React from 'react'
import { Flex } from 'reflexbox'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import ListCard, { Column } from './ListCard'
import TextButton from '~/ui/global/TextButton'
import v from '~/utils/variables'

class CollectionList extends React.Component {
  get columns() {
    return [
      { name: 'Idea names', style: { width: '500px' } },
      { name: 'Last updated', style: { width: '400px' } },
      { name: 'Permissions', style: {} },
      { name: '', style: { marginLeft: 'auto' } },
    ]
  }

  render() {
    const {
      collection: { collection_cards },
    } = this.props
    return (
      <div>
        <Flex mb={1}>
          {this.columns.map(column => (
            <Column {...column.style}>
              <TextButton color={v.colors.black}>{column.name}</TextButton>
            </Column>
          ))}
        </Flex>
        {collection_cards.map(card => (
          <ListCard card={card} />
        ))}
      </div>
    )
  }
}
CollectionList.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionList
