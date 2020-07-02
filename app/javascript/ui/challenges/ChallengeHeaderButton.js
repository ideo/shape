import _ from 'lodash'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { uiStore } from '~/stores'
import Button from '~/ui/global/Button'
import v from '~/utils/variables'

const buttonStyleProps = {
  width: 256,
  size: 'sm',
  style: { marginLeft: '1rem' },
}

@inject('apiStore')
@observer
class ChallengeHeaderButton extends React.Component {
  componentDidMount() {
    const { record } = this.props
    record.fetchChallengeReviewersGroup()
  }

  // TODO combine this logic with AddReviewersPopover
  get potentialReviewers() {
    const { record } = this.props
    const challengeRoles = _.get(record, 'challengeReviewerGroup.roles')
    if (_.isEmpty(challengeRoles)) return []
    const memberRole = challengeRoles.find(r => r.label === 'member')
    return _.get(memberRole, 'users', [])
  }

  render() {
    const { apiStore, record } = this.props

    if (!record.isChallengeOrInsideChallenge) return null

    if (!record.isSubmissionBox && record.canEdit) {
      return (
        <Button
          {...buttonStyleProps}
          colorScheme={v.colors.primaryDark}
          onClick={() => uiStore.update('challengeSettingsOpen', true)}
        >
          Challenge Settings
        </Button>
      )
    } else {
      const isChallengeReviewer = this.potentialReviewers.find(
        r => r.id === apiStore.currentUser.id
      )
      if (!isChallengeReviewer) return null
      const reviewableCards = _.get(
        record,
        'submissions_collection.reviewableCards'
      )
      const hasReviewableSubmissions = !_.isEmpty(reviewableCards)
      return (
        <Button
          {...buttonStyleProps}
          colorScheme={v.colors.alert}
          disabled={!hasReviewableSubmissions}
          onClick={() => record.navigateToNextAvailableTest()}
        >
          {hasReviewableSubmissions
            ? `Review Submissions`
            : `No Reviewable Submissions`}
        </Button>
      )
    }
    return null
  }
}

ChallengeHeaderButton.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ChallengeHeaderButton
