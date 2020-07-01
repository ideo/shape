import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex, Box } from 'reflexbox'

import ChallengeSubHeader from '~/ui/layout/ChallengeSubHeader'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import EditableName from '~/ui/pages/shared/EditableName'
import IconHolder from '~/ui/icons/IconHolder'
import { MaxWidthContainer } from '~/ui/global/styled/layout'
import v from '~/utils/variables'
import { renderChallengeButton } from '~/ui/pages/shared/PageHeader'

const ChallengeFixedHeader = ({
  collection,
  challengeNavigationHandler,
  handleShowSettings,
  handleReviewSubmissions,
}) => {
  const { name, collection_type, icon } = collection
  return (
    <MaxWidthContainer>
      {/* Show subheader if a parent collection is a challenge */}
      {collection_type !== 'challenge' && (
        <ChallengeSubHeader
          challengeName={name}
          challengeNavigationHandler={challengeNavigationHandler}
        />
      )}
      <Flex data-empty-space-click style={{ minHeight: v.headerHeight }}>
        <Box>
          <EditableName
            name={name}
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
            <CollectionIcon type={icon} size="lg" />
          </IconHolder>
        </Box>

        <Box
          flex
          style={{
            marginLeft: '8px',
            marginRight: '30px',
            flexGrow: '1',
            justifyContent: 'flex-end',
          }}
        >
          {renderChallengeButton(
            collection,
            handleShowSettings,
            handleReviewSubmissions
          )}
        </Box>
      </Flex>
    </MaxWidthContainer>
  )
}

ChallengeFixedHeader.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  handleShowSettings: PropTypes.func.isRequired,
  handleReviewSubmissions: PropTypes.func.isRequired,
  challengeNavigationHandler: PropTypes.func.isRequired,
}

export default ChallengeFixedHeader
