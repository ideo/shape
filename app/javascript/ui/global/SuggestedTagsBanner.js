import { useState, useEffect } from 'react'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import Banner from '~/ui/layout/Banner'
import PillList from '~/ui/global/PillList'
import v from '~/utils/variables'
import { Heading3 } from '~/ui/global/styled/typography'
import CloseIcon from '~/ui/icons/CloseIcon'

const CloseTagWrapper = styled.div`
  width: 15px;
  cursor: pointer;
  float: right;
`
CloseTagWrapper.displayName = 'CloseTagWrapper'

export const formatSuggestedTags = ({
  suggestions,
  existingTags,
  onSelect,
}) => {
  return suggestions.map((suggestion, idx) => {
    const formattedTag = {
      id: idx,
      type: 'tag',
      name: suggestion,
      label: suggestion,
      selectable: true,
      selected: existingTags.includes(suggestion),
    }
    formattedTag.onSelect = () => onSelect && onSelect(suggestion)
    return formattedTag
  })
}

const SuggestedTagsBanner = ({ collection, suggestions }) => {
  const [formattedTags, setFormattedTags] = useState([])
  const { submissionTypeName } = collection

  useEffect(() => {
    setFormattedTags(
      formatSuggestedTags({
        suggestions,
        existingTags: collection.tag_list,
        onSelect,
      })
    )
  }, [collection.tag_list.join(',')])

  const onSelect = tag => {
    if (collection.tag_list.includes(tag)) {
      collection.removeTag(tag, 'tag_list')
    } else {
      collection.addTag(tag, 'tag_list')
    }
  }

  const hideBanner = () => {
    collection.API_hideSubmissionTopicSuggestions()
  }

  return (
    <Banner
      color={v.colors.primaryDark}
      leftComponent={
        <React.Fragment>
          <Heading3 color={v.colors.white} style={{ marginRight: '20px' }}>
            Add Tags To Your {submissionTypeName || 'Idea'}
          </Heading3>
          <PillList itemList={formattedTags} />
        </React.Fragment>
      }
      rightComponent={
        <CloseTagWrapper onClick={hideBanner}>
          <CloseIcon />
        </CloseTagWrapper>
      }
    />
  )
}

SuggestedTagsBanner.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  suggestions: MobxPropTypes.arrayOrObservableArray,
}

SuggestedTagsBanner.defaultProps = {
  suggestions: [],
}

export default SuggestedTagsBanner
