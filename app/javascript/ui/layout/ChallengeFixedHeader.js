import PropTypes from 'prop-types'
import { Flex, Box } from 'reflexbox'
import ChallengeSettingsModal from '~/ui/challenges/ChallengeSettingsModal'
import { collectionTypeToIcon } from '~/ui/global/CollectionTypeIcon'
import EditableName from '~/ui/pages/shared/EditableName'
import IconHolder from '~/ui/icons/IconHolder'
import { MaxWidthContainer } from '~/ui/global/styled/layout'
import ChallengeSubHeader from '~/ui/layout/ChallengeSubHeader'
import TopRightChallengeButton from '~/ui/global/TopRightChallengeButton'
import { uiStore } from '~/stores'
import v from '~/utils/variables'

const ChallengeFixedHeader = ({
  challengeName,
  collectionName,
  collectionType,
  onSettingsClick,
  challengeNavigationHandler,
}) => {
  return (
    <MaxWidthContainer>
      <ChallengeSettingsModal open={uiStore.challengeSettingsOpen} />
      {collectionType !== 'challenge' && (
        <ChallengeSubHeader
          challengeName={challengeName}
          challengeNavigationHandler={challengeNavigationHandler}
        />
      )}
      <Flex
        data-empty-space-click
        align="center"
        style={{ minHeight: v.headerHeight }}
      >
        <Box>
          <EditableName
            name={collectionName}
            updateNameHandler={e => e.preventDefault()}
            inline
          />
          <IconHolder
            height={32}
            width={32}
            display={'inline-block'}
            marginTop={8}
            marginLeft={10}
          >
            {collectionTypeToIcon({
              type: collectionType,
              size: 'lg',
            })}
          </IconHolder>
        </Box>

        <Box auto></Box>

        <Box flex align="center" style={{ marginLeft: '8px' }}>
          <TopRightChallengeButton
            name={'Challenge Settings'}
            onClick={onSettingsClick}
          />
        </Box>
      </Flex>
    </MaxWidthContainer>
  )
}

ChallengeFixedHeader.propTypes = {
  challengeName: PropTypes.string,
  collectionName: PropTypes.string,
  collectionType: PropTypes.string,
  onSettingsClick: PropTypes.func,
  challengeNavigationHandler: PropTypes.func,
}

ChallengeFixedHeader.defaultProps = {
  challengeName: '',
  collectionName: '',
  collectionType: null,
  onSettingsClick: () => {},
  challengeNavigationHandler: () => {},
}

export default ChallengeFixedHeader
