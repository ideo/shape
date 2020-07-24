import _ from 'lodash'
import PropTypes from 'prop-types'
import { computed } from 'mobx'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'

import AddReviewersPopover from '~/ui/challenges/AddReviewersPopover'
import AvatarList from '~/ui/users/AvatarList'
import ChallengeReviewButton from '~/ui/challenges/ChallengeReviewButton'
import ListCard from '~/ui/grid/ListCard'

export const transformColumnsForChallenge = columns =>
  _.map(columns, col => {
    if (col.name === 'last_updated') {
      col.style.width = '400px'
    }
    if (col.name === 'permissions') {
      col.displayName = 'Reviewers'
      col.name = 'reviewers'
    }
    if (col.name === 'actions') {
      // make room for review button
      col.style.width = '175px'
    }
    return col
  })

@inject('apiStore')
@observer
class ChallengeListCard extends React.Component {
  constructor(props) {
    super(props)
    this.rolesWrapperRef = React.createRef()
    this.state = {
      isReviewersOpen: false,
    }
  }

  handleRolesClick = ev => {
    ev.stopPropagation()
    this.setState({
      isReviewersOpen: true,
    })
  }

  handleCloseReviewers = ev => {
    this.setState({
      isReviewersOpen: false,
    })
  }

  get showReviewers() {
    const { record } = this.props
    return record.internalType !== 'items'
  }

  @computed
  get columnsWithChallengeContent() {
    const { columns, record, submissionsCollection } = this.props
    const { isCurrentUserAReviewer, submission_reviewer_status } = record

    return _.map(columns, column => {
      if (column.name === 'reviewers') {
        column.overrideContent = columnRef => {
          return (
            <div
              style={{ width: '100%' }}
              key={`col-${this.state.isReviewersOpen}`}
            >
              <AvatarList
                avatars={record.taggedUsersWithStatuses}
                onAdd={this.handleRolesClick}
              />
              <AddReviewersPopover
                record={record}
                potentialReviewers={submissionsCollection.potentialReviewers}
                onClose={this.handleCloseReviewers}
                wrapperRef={columnRef}
                open={this.state.isReviewersOpen}
              />
            </div>
          )
        }
      }
      if (column.name === 'actions' && isCurrentUserAReviewer) {
        column.overrideContent = () =>
          submission_reviewer_status && (
            <ChallengeReviewButton
              key="column3"
              reviewerStatus={submission_reviewer_status}
              onClick={() => {
                record.navigateToTest()
              }}
            />
          )
      }
      return column
    })
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
  submissionsCollection: MobxPropTypes.objectOrObservableObject.isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape(ColumnPropType)).isRequired,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  searchResult: PropTypes.bool,
}
ChallengeListCard.defaultProps = {
  searchResult: false,
}

export default ChallengeListCard
