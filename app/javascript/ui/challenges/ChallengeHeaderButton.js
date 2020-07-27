import { useState, useEffect } from 'react'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import Button from '~/ui/global/Button'
import v from '~/utils/variables'

const buttonStyleProps = {
  width: 256,
  size: 'sm',
  style: { marginLeft: '1rem' },
}

const ChallengeSettingsButton = ({ record }) => {
  const { uiStore } = record.apiStore
  return (
    <Button
      {...buttonStyleProps}
      colorScheme={v.colors.primaryDark}
      onClick={() => uiStore.update('challengeSettingsOpen', true)}
      data-cy="ChallengeSettingsButton"
    >
      Challenge Settings
    </Button>
  )
}

ChallengeSettingsButton.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
}

ChallengeSettingsButton.displayName = 'ChallengeSettingsButton'

export const ReviewSubmissionsButton = ({ record }) => {
  const [nextAvailableTestPath, setNextAvailableTestPath] = useState(null)

  useEffect(() => {
    const loadNextAvailableTest = async () => {
      const path = await record.API_getNextAvailableTest()
      setNextAvailableTestPath(path)
    }
    loadNextAvailableTest()
  }, [record])

  return (
    <Button
      {...buttonStyleProps}
      colorScheme={v.colors.alert}
      disabled={!nextAvailableTestPath}
      onClick={() =>
        nextAvailableTestPath &&
        record.routingStore.routeTo(nextAvailableTestPath)
      }
    >
      {nextAvailableTestPath
        ? `Review Submissions`
        : `No Reviewable Submissions`}
    </Button>
  )
}

ReviewSubmissionsButton.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
}

ReviewSubmissionsButton.displayName = 'ReviewSubmissionsButton'

const ChallengeHeaderButton = ({ record, parentChallenge }) => {
  if (!record.isChallengeOrInsideChallenge || !parentChallenge) {
    return null
  }
  if (parentChallenge.canEdit) {
    return <ChallengeSettingsButton record={record} />
  } else if (record.in_reviewer_group) {
    return <ReviewSubmissionsButton record={record} />
  }
  return null
}

ChallengeHeaderButton.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  parentChallenge: MobxPropTypes.objectOrObservableObject,
}

ChallengeHeaderButton.defaultProps = {
  parentChallenge: null,
}

ChallengeHeaderButton.displayName = 'ChallengeHeaderButton'

export default ChallengeHeaderButton
