import React from 'react'
import { observable, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'

import DropdownIcon from '~/ui/icons/DropdownIcon'
import ListCard, { Column } from './ListCard'
import { Heading3 } from '~/ui/global/styled/typography'
import { uiStore } from '~/stores'
import v from '~/utils/variables'

@observer
class CollectionList extends React.Component {
  @observable
  reviewerStatuses = []

  componentDidMount() {
    this.fetchCards()
    if (this.insideChallenge) {
      this.fetchReviewerStatuses()
    }
  }

  fetchCards({ sort } = {}) {
    const { collection } = this.props
    collection.API_fetchCardRoles()
  }

  async fetchReviewerStatuses() {
    const { collection } = this.props
    const statuses = await collection.API_fetchCardReviewerStatues()
    runInAction(() => {
      this.reviewerStatuses = statuses
      statuses.each(status => {
        const card = collection.collection_cards.find(
          card => card.record.id === status.record_id
        )
        if (card) {
          const taggedUser = card.record.taggedUsers.find(
            u => u.id === status.user_id
          )
          taggedUser.color = v.statusColor[status.status]
        }
      })
    })
  }

  get insideChallenge() {
    const { collection } = this.props
    return collection.isChallengeOrInsideChallenge
  }

  get columns() {
    return [
      { displayName: '', style: { width: '50px' }, name: 'select' },
      {
        displayName: 'Name',
        name: 'name',
        style: { width: '500px' },
      },
      {
        displayName: 'Last updated',
        name: 'last_updated',
        style: { width: '400px' },
      },
      {
        displayName: this.insideChallenge ? 'Reviewers' : 'Permissions',
        name: this.insideChallenge ? 'reviewers' : 'permissions',
        style: { width: '250px' },
      },
      { displayName: '', style: { marginLeft: 'auto' }, name: 'actions' },
    ]
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
        {this.sortedCards.map(card => (
          <ListCard
            card={card}
            insideChallenge={this.insideChallenge}
            searchResult={collection.isSearchResultsCollection}
            key={card.id}
          />
        ))}
      </div>
    )
  }
}
CollectionList.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionList
