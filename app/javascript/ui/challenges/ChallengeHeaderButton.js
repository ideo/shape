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
  render() {
    const { record } = this.props

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
      const { currentUserHasSubmissionsToReview } = record
      return (
        <Button
          {...buttonStyleProps}
          colorScheme={v.colors.alert}
          disabled={!currentUserHasSubmissionsToReview}
          onClick={() => record.navigateToNextAvailableTest()}
        >
          {currentUserHasSubmissionsToReview
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

ChallengeHeaderButton.displayName = 'ChallengeHeaderButton'

export default ChallengeHeaderButton
