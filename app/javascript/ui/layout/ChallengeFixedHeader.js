import PropTypes from 'prop-types'
import { Flex, Box } from 'reflexbox'
import ChallengeSettingsModal from '~/ui/challenges/ChallengeSettingsModal'
import { collectionTypeToIcon } from '~/ui/global/CollectionTypeIcon'
import EditableName from '~/ui/pages/shared/EditableName'
import IconHolder from '~/ui/icons/IconHolder'
import { MaxWidthContainer } from '~/ui/global/styled/layout'
import ChallengeSubHeader from '~/ui/layout/ChallengeSubHeader'
import ChallengeSettingsButton from '~/ui/global/ChallengeSettingsButton'
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
      <ChallengeSubHeader
        challengeName={challengeName}
        challengeNavigationHandler={challengeNavigationHandler}
      />
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
          <ChallengeSettingsButton onSettingsClick={onSettingsClick} />
        </Box>
      </Flex>
    </MaxWidthContainer>
  )
}

ChallengeFixedHeader.propTypes = {
  challengeName: PropTypes.string.isRequired,
  collectionName: PropTypes.string.isRequired,
  collectionType: PropTypes.string.isRequired,
  onSettingsClick: PropTypes.func.isRequired,
  challengeNavigationHandler: PropTypes.func.isRequired,
}

export default ChallengeFixedHeader
