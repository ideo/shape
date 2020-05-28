import PropTypes from 'prop-types'
import { Flex, Box } from 'reflexbox'

import Button from '~/ui/global/Button'
import ChallengeSettingsModal from '~/ui/challenges/ChallengeSettingsModal'
import { collectionTypeToIcon } from '~/ui/global/CollectionTypeIcon'
import EditableName from '~/ui/pages/shared/EditableName'
import IconHolder from '~/ui/icons/IconHolder'
import { MaxWidthContainer } from '~/ui/global/styled/layout'
import { uiStore } from '~/stores'
import v from '~/utils/variables'

const ChallengeFixedHeader = ({
  challengeName,
  collectionType,
  onSettingsClick,
}) => {
  return (
    <MaxWidthContainer>
      <ChallengeSettingsModal open={uiStore.challengeSettingsOpen} />
      <Flex
        data-empty-space-click
        align="center"
        style={{ minHeight: v.headerHeight }}
      >
        <Box>
          <EditableName
            name={challengeName}
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
          <Button
            style={{ marginLeft: '1rem' }}
            colorScheme={v.colors.primaryDarkest}
            size="sm"
            width={256}
            onClick={onSettingsClick}
          >
            Challenge Settings
          </Button>
        </Box>
      </Flex>
    </MaxWidthContainer>
  )
}

ChallengeFixedHeader.propTypes = {
  challengeName: PropTypes.string.isRequired,
  collectionType: PropTypes.string.isRequired,
  onSettingsClick: PropTypes.func.isRequired,
}

export default ChallengeFixedHeader
