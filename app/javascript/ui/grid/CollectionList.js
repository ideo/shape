import React from 'react'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'

import DropdownIcon from '~/ui/icons/DropdownIcon'
import ListCard, { Column } from './ListCard'
import { Heading3 } from '~/ui/global/styled/typography'
import ChallengeListCard, {
  transformColumnsForChallenge,
} from '~/ui/challenges/ChallengeListCard'
import { uiStore } from '~/stores'
import v from '~/utils/variables'

export const DEFAULT_COLUMNS = [
  { displayName: '', style: { width: '50px' }, name: 'select' },
  {
    displayName: 'Name',
    name: 'name',
    style: { width: '500px' },
  },
  {
    displayName: 'Last updated',
    name: 'last_updated',
    style: {
      width: '300px',
    },
  },
  {
    displayName: 'Permissions',
    name: 'permissions',
    style: { width: '250px' },
  },
  { displayName: '', style: { marginLeft: 'auto' }, name: 'actions' },
]

@observer
class CollectionList extends React.Component {
  componentDidMount() {
    this.fetchRoles()
  }

  fetchRoles() {
    const { collection } = this.props
    collection.API_fetchCardRoles()
  }

  get columns() {
    const { collection } = this.props
    const cols = DEFAULT_COLUMNS
    if (collection.isSubmissionsCollectionInsideChallenge) {
      return transformColumnsForChallenge(cols)
    }
    return cols
  }

  get sortedCards() {
    const { collection } = this.props
    if (collection.isSearchResultsCollection) {
      return collection.collection_cards
    }
    return collection.sortedCards
  }

  // NOTE: not used yet.
  handleSort = column => {
    const { collection } = this.props
    uiStore.update('collectionCardSortOrder', column)
    collection.API_sortCards()
  }

  render() {
    const { collection } = this.props
    return (
      <div>
        <Flex mb={1}>
          {this.columns.map(column => (
            <Column {...column.style} key={column.name} data-cy="ListColumn">
              <Heading3 color={v.colors.black}>{column.displayName}</Heading3>
              {column.sortable && (
                <span style={{ width: '20px', height: '20px' }}>
                  <DropdownIcon />
                </span>
              )}
            </Column>
          ))}
        </Flex>
        {this.sortedCards.map(card => {
          const mainProps = {
            card,
            columns: this.columns,
            record: card.record,
            searchResult: collection.isSearchResultsCollection,
            key: card.id,
          }
          return collection.isSubmissionsCollectionInsideChallenge ? (
            <ChallengeListCard
              {...mainProps}
              submissionsCollection={collection}
            />
          ) : (
            <ListCard {...mainProps} />
          )
        })}
      </div>
    )
  }
}
CollectionList.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionList
