import _ from 'lodash'
import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { action, computed, observable, runInAction } from 'mobx'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import ListCard from '~/ui/grid/ListCard'

export const transformColumnsForChallenge(columns) {
  columns[2].style.width = '400px'
  columns[3].displayName = 'Reviewers'
  columns[3].name = 'reviewers'
  return columns
}

@observer
class ChallengeListCard extends React.Component {
  @observable
  isReviewersOpen = false

  constructor(props) {
    super(props)
    this.rolesWrapperRef = React.createRef()
  }

  handleRolesClick = ev => {
    ev.stopPropagation()
    runInAction(() => {
      this.isReviewersOpen = true
    })
  }

  handleCloseReviewers = ev => {
    runInAction(() => {
      this.isReviewersOpen = false
    })
  }

  get cardsForTagging() {
    const { apiStore } = this.props
    if (apiStore.selectedCards.length > 0) {
      return apiStore.selectedCards
    } else {
      const { card } = this.props
      return [card]
    }
  }

  get showReviewers() {
    const { record, insideChallenge } = this.props
    return insideChallenge && record.internalType !== 'items'
  }

  get renderActions() {
    if (isCurrentUserAReviewer && submission_reviewer_status) {
      return (
      )
    }

    return null
  }

  get columnsWithChallengeContent() {
    const {
      columns,
      record,
    } = this.props
    columns[4].overrideContent = (
      <div ref={this.rolesWrapperRef} style={{ width: '100%' }}>
        <AvatarList
          avatars={record.taggedUsersWithStatuses}
          onAdd={this.handleRolesClick}
        />
        {!_.isEmpty(record.potentialReviewers) && (
          <AddReviewersPopover
            record={record}
            potentialReviewers={record.potentialReviewers}
            onClose={this.handleCloseReviewers}
            wrapperRef={this.rolesWrapperRef}
            open={this.isReviewersOpen}
          />
        )}
      </div>
    )
    columns[5].overrideContent = isCurrentUserAReviewer && submission_reviewer_status && (
      <ChallengeReviewButton
        reviewerStatus={submission_reviewer_status}
        onClick={() => {
          record.navigateToNextAvailableTest()
        }}
      />
    )

    return columns
  }

  render() {
    const {
      record,
    } = this.props
    const { isCurrentUserAReviewer, submission_reviewer_status } = record

    return (
      <ListCard
        columns={this.columnsWithChallengeContent}
      />
    )
  }
}
ChallengeListCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  searchResult: PropTypes.bool,
}
ChallengeListCard.defaultProps = {
  searchResult: false,
}

export default ListCard
