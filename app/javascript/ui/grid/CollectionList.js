import _ from 'lodash'
import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'

import DropdownIcon from '~/ui/icons/DropdownIcon'
import GridCardPagination from '~/ui/grid/GridCardPagination'
import ListCard, { Column } from '~/ui/grid/ListCard'
import { Heading3 } from '~/ui/global/styled/typography'
import { uiStore } from '~/stores'
import v from '~/utils/variables'

@observer
class CollectionList extends React.Component {
  @observable
  reviewerStatuses = []

  componentDidMount() {
    this.fetchCards()
    if (this.submissionBoxInsideChallenge) {
      this.initializeReviewerGroup()
      this.fetchReviewerStatuses()
    }
  }

  async initializeReviewerGroup() {
    const { collection } = this.props
    // intialize parent challenge if it's not already intialized during initial load, ie: switching viewMode
    if (!collection.parentChallenge) {
      await collection.initializeParentChallengeForCollection()
    }

    await collection.API_fetchChallengeReviewersGroup()
  }

  get potentialReviewers() {
    const { collection } = this.props
    if (!collection.isSubmissionsCollection) return []

    const challengeReviewerRoles = _.get(
      collection,
      'challengeReviewerGroup.roles'
    )

    if (_.isEmpty(challengeReviewerRoles)) return []

    const potentialReviewerList = []
    _.each(['admin', 'member'], roleLabel => {
      const role = challengeReviewerRoles.find(r => r.label === roleLabel)
      const users = _.get(role, 'users', [])
      _.each(users, user => {
        potentialReviewerList.push(user)
      })
    })
    return potentialReviewerList
  }

  fetchCards({ sort } = {}) {
    const { collection } = this.props
    collection.API_fetchCardRoles()
  }

  async fetchReviewerStatuses() {
    const { collection } = this.props
    const res = await collection.API_fetchCardReviewerStatues()
    const statuses = res.data
    if (!statuses) return
    runInAction(() => {
      this.reviewerStatuses = statuses
      statuses.forEach(status => {
        const card = collection.collection_cards.find(
          card => parseInt(card.record.id) === parseInt(status.record_id)
        )
        if (card) {
          const taggedUser = card.record.tagged_users.find(
            u => parseInt(u.id) === parseInt(status.user_id)
          )
          if (!taggedUser) return
          taggedUser.color = v.statusColor[status.status]
        }
      })
    })
  }

  get submissionBoxInsideChallenge() {
    const { collection } = this.props
    return (
      collection.isChallengeOrInsideChallenge &&
      collection.isSubmissionsCollection &&
      collection.submission_box_type === 'template'
    )
  }

  get columns() {
    let columnData = [
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
          width: !this.submissionBoxInsideChallenge ? '400px' : '300px',
        },
      },
      {
        displayName: this.submissionBoxInsideChallenge
          ? 'Reviewers'
          : 'Permissions',
        name: this.submissionBoxInsideChallenge ? 'reviewers' : 'permissions',
        style: { width: '250px' },
      },
      { displayName: '', style: { marginLeft: 'auto' }, name: 'actions' },
    ]
    if (uiStore.isMobile) {
      columnData = _.reject(columnData, column =>
        _.includes(['last_updated', 'permissions'], column.name)
      )
    }

    return columnData
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
    const { collection, loadCollectionCards } = this.props

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
            insideChallenge={this.submissionBoxInsideChallenge}
            searchResult={collection.isSearchResultsCollection}
            key={card.id}
            record={card.record}
            columns={_.map(this.columns, 'name')}
            potentialReviewers={this.potentialReviewers}
          />
        ))}
        {collection.hasMore && (
          <GridCardPagination
            collection={collection}
            loadCollectionCards={loadCollectionCards}
            nextPage={collection.nextPage}
          />
        )}
      </div>
    )
  }
}
CollectionList.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  loadCollectionCards: PropTypes.func.isRequired,
}

export default CollectionList
