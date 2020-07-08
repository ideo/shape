import _ from 'lodash'
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
  fetchCards({ sort } = {}) {
    const { collection } = this.props
    collection.API_fetchCardRoles()
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
    const cols = [
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
    if (this.submissionBoxInsideChallenge) return transformColumnsForChallenge(cols)
    return cols
  }

  get sortedCards() {
    const { collection } = this.props
    if (collection.isSearchResultsCollection) {
      return collection.collection_cards
    }
    return collection.sortedCards
  }

  statusesForSubmission(record) {
    if (_.isEmpty(this.submissionsReviewerStatuses) || !record) return []
    if (!record.isSubmission) {
      return []
    }

    // filter for each status object for each submission in a submissions collection
    const statuses = _.filter(this.submissionsReviewerStatuses, status => {
      return parseInt(status.record_id) === parseInt(record.id)
    })

    return statuses
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
          return this.submissionBoxInsideChallenge ?
            <ChallengeListCard {...mainProps} /> :
            <ListCard {...mainProps} />
        })}
      </div>
    )
  }
}
CollectionList.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionList
