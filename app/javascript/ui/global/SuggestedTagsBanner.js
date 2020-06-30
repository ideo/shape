import { PropTypes as MobxPropTypes } from 'mobx-react'

import Banner from '~/ui/layout/Banner'
import PillList from '~/ui/global/PillList'
import v from '~/utils/variables'
import { Heading3 } from '~/ui/global/styled/typography'
import CloseIcon from '~/ui/icons/CloseIcon'

const formatTags = ({ tags, suggestions, onSelect }) => {
  return suggestions.map((suggestion, idx) => {
    const formattedTag = {
      id: idx,
      type: 'tag',
      name: suggestion,
      label: suggestion,
      selectable: true,
      selected: tags.includes(suggestion),
    }
    formattedTag.onSelect = () => onSelect && onSelect(suggestion)
    return formattedTag
  })
}

const SuggestedTagsBanner = ({ collection, suggestions }) => {
  const onSelect = tag => {
    if (collection.tag_list.includes(tag)) {
      console.log('onSelect - add tag')
      collection.addTag(tag, 'tag_list')
    } else {
      console.log('onSelect - remove tag')
      collection.removeTag(tag, 'tag_list')
    }
  }

  const hideBanner = () => {
    console.log('hide banner')
  }

  return (
    <Banner
      color={v.colors.primaryDark}
      leftComponent={
        <React.Fragment>
          <Heading3 color={v.colors.white} style={{ marginRight: '20px' }}>
            Add Tags To Your Idea
          </Heading3>
          <PillList
            itemList={formatTags({
              tags: collection.tag_list,
              suggestions,
              onSelect,
            })}
          />
        </React.Fragment>
      }
      rightComponent={
        <div onClick={hideBanner} style={{ width: '20px', cursor: 'pointer' }}>
          <CloseIcon />
        </div>
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
