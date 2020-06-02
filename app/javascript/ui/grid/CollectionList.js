import React from 'react'
import { Flex } from 'reflexbox'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import ArrowIcon from '~/ui/icons/ArrowIcon'
import ListCard, { Column } from './ListCard'
import TextButton from '~/ui/global/TextButton'
import v from '~/utils/variables'

class CollectionList extends React.Component {
  componentDidMount() {
    this.fetchCards()
  }

  fetchCards({ sort } = {}) {
    const { collection } = this.props
    collection.API_fetchCards({ include: ['roles'] })
  }

  get columns() {
    return [
      { displayName: '', style: { width: '50px' } },
      {
        displayName: 'Idea name',
        name: 'name',
        style: { width: '500px' },
        sortable: true,
      },
      {
        displayName: 'Last updated',
        name: 'last_updated',
        style: { width: '400px' },
        sortable: true,
      },
      { displayName: 'Permissions', style: {} },
      { displayName: '', style: { marginLeft: 'auto' } },
    ]
  }

  handleSort = column => {
    // const { collection } = this.props
    // uiStore.update('collectionCardSortOrder', ev.target.value)
    // collection.API_sortCards()
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
              <TextButton
                color={v.colors.black}
                onClick={() => this.handleSort(column)}
              >
                {column.displayName}
              </TextButton>
              {column.sortable && (
                <span style={{ width: '12px', height: '12px' }}>
                  <ArrowIcon rotation={90} />
                </span>
              )}
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
