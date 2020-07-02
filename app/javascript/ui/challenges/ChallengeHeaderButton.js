import _ from 'lodash'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import { uiStore } from '~/stores'
import Button from '~/ui/global/Button'
import v from '~/utils/variables'

const buttonStyleProps = {
  width: 256,
  size: 'sm',
  style: { marginLeft: '1rem' },
}

const ChallengeHeaderButton = ({ record }) => {
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
    // TODO: only show this if they are in the reviewer group
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
        onClick={() => record.navigateToNextAvailableInCollectionTestOrTest()}
      >
        {hasReviewableSubmissions
          ? `Review Submissions`
          : `No Reviewable Submissions`}
      </Button>
    )
  }
  return null
}

ChallengeHeaderButton.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ChallengeHeaderButton
