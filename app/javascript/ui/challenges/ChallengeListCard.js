import _ from 'lodash'
import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'

import AddReviewersPopover from '~/ui/challenges/AddReviewersPopover'
import AvatarList from '~/ui/users/AvatarList'
import ChallengeReviewButton from '~/ui/challenges/ChallengeReviewButton'
import ListCard from '~/ui/grid/ListCard'

export const transformColumnsForChallenge = columns => {
  columns[2].style.width = '400px'
  columns[3].displayName = 'Reviewers'
  columns[3].name = 'reviewers'
  return columns
}

@inject('apiStore')
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
    const { record } = this.props
    return record.internalType !== 'items'
  }

  get columnsWithChallengeContent() {
    const { columns, record } = this.props
    const { isCurrentUserAReviewer, submission_reviewer_status } = record
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
    columns[5].overrideContent = isCurrentUserAReviewer &&
      submission_reviewer_status && (
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
    return (
      <ListCard {...this.props} columns={this.columnsWithChallengeContent} />
    )
  }
}

const ColumnPropType = {
  name: PropTypes.string,
  displayName: PropTypes.string,
  style: PropTypes.object,
}

ChallengeListCard.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

ChallengeListCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape(ColumnPropType)).isRequired,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  searchResult: PropTypes.bool,
}
ChallengeListCard.defaultProps = {
  searchResult: false,
}

export default ListCard
