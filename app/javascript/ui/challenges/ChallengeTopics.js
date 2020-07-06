import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { useState, useEffect } from 'react'
import { toJS } from 'mobx'
import { Flex, Box } from 'reflexbox'
import styled from 'styled-components'

import CollectionCardsTagEditor from '~/ui/pages/shared/CollectionCardsTagEditor'
import v from '~/utils/variables'
import InfoIcon from '~/ui/icons/InfoIcon'
import { SmallHelperText } from '~/ui/global/styled/typography'

const InfoIconWrapper = styled.div`
  width: 16px;
  height: 16px;
  color: ${v.colors.commonMedium};
  > .icon {
    width: 16px;
  }
`

const ChallengeTopics = ({ collection, closeModal }) => {
  const [inputValue, setInputValue] = useState(null)
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    const loadTags = async () => {
      const {
        apiStore: { currentOrganization },
      } = collection
      const tagsAndUsers = await currentOrganization.searchTagsAndUsers(
        inputValue
      )
      setSuggestions(tagsAndUsers)
    }
    loadTags()
  }, [inputValue])

  return (
    <React.Fragment>
      <Flex mt={1} mb={20} justifyContent="center" alignItems="center">
        <Box mt={'2px'}>
          <InfoIconWrapper>
            <InfoIcon />
          </InfoIconWrapper>
        </Box>
        <Box ml={1} maxWidth="600px">
          <SmallHelperText>
            Adding topics will allow participants to easily tag their
            submissions according to the topics defined here.
          </SmallHelperText>
        </Box>
      </Flex>
      <CollectionCardsTagEditor
        records={[collection]}
        cardIds={[collection.parent_collection_card.id]}
        canEdit={true}
        placeholder="Add new topics, separated by comma or pressing enter."
        overrideTagType="topic_list"
        handleInputChange={value => setInputValue(value)}
        suggestions={toJS(suggestions)}
      />
    </React.Fragment>
  )
}

ChallengeTopics.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  closeModal: PropTypes.func.isRequired,
}

export default ChallengeTopics
