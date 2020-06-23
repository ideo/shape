import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import _ from 'lodash'
import ReactTags from 'react-tag-autocomplete'

import Pill from '~/ui/global/Pill'
import StyledReactTags, {
  creativeDifferenceTagIcon,
} from '~/ui/pages/shared/StyledReactTags'
import Avatar from '~/ui/global/Avatar'

const TagEditor = ({
  recordTags,
  afterAddTag,
  afterRemoveTag,
  tagField,
  canEdit,
  tagColor,
  placeholder,
  validateTag,
}) => {
  const [error, setError] = useState('')
  const [formattedTags, setFormattedTags] = useState([])

  const getFormattedTag = ({ label, type }) => ({
    id: label,
    label,
    name: label,
    type,
    onDelete: () => {
      handleDelete({ label, type })
    },
    symbol:
      type !== 'user_tag_list' ? (
        creativeDifferenceTagIcon(label)
      ) : (
        <Avatar size={18} />
      ),
    symbolSize: 18,
  })

  const handleDelete = ({ label, type }) => {
    const tagToDelete = _.find(formattedTags, { label, type })
    if (tagToDelete) {
      setFormattedTags(_.without(formattedTags, tagToDelete))
      afterRemoveTag({ label, type })
    }
  }

  const handleAddition = tagData => {
    tagData.name = tagData.name.trim()

    const newTag = getFormattedTag({
      label: tagData.name,
      type: tagField,
    })

    const duplicateTag = _.find(formattedTags, t => {
      t.name.toUpperCase() === newTag.name.toUpperCase() && t.type === tagField
    })
    // Return if duplicate tag is found
    if (duplicateTag) {
      return
    }

    // If a validateTag function is provided, validate tag
    if (validateTag) {
      const { tag, error } = validateTag(newTag.name)
      if (error) {
        setError(error)
        return
      } else {
        newTag.name = tag
      }
    }

    formattedTags.push(newTag)
    const { label, type } = newTag
    afterAddTag({ label, type })
  }

  useEffect(() => {
    setFormattedTags(
      _.map(recordTags, ({ label, type }) => getFormattedTag({ label, type }))
    )
  }, [recordTags.length])

  const readonlyTags = () => {
    if (formattedTags.length === 0) {
      return 'No tags added.'
    }
    return (
      <div className="react-tags__selected">
        {formattedTags.map(tag => (
          <Pill key={tag.id} tag={tag} />
        ))}
      </div>
    )
  }

  return (
    <StyledReactTags tagColor={tagColor}>
      {!canEdit && readonlyTags()}
      {canEdit && (
        <ReactTags
          tags={formattedTags}
          allowBackspace={false}
          delimiterChars={[',']}
          placeholder={placeholder}
          handleAddition={handleAddition}
          handleDelete={handleDelete}
          tagComponent={Pill}
          allowNew
        />
      )}
      {error && <div className="error">{error}</div>}
    </StyledReactTags>
  )
}

TagEditor.displayName = 'TagEditor'

TagEditor.propTypes = {
  recordTags: PropTypes.array.isRequired,
  afterAddTag: PropTypes.func.isRequired,
  afterRemoveTag: PropTypes.func.isRequired,
  tagField: PropTypes.string.isRequired,
  canEdit: PropTypes.bool,
  tagColor: PropTypes.string,
  placeholder: PropTypes.string,
  validateTag: PropTypes.func,
}

TagEditor.defaultProps = {
  canEdit: false,
  tagColor: 'gray',
  placeholder: 'Add new tags, separated by comma or pressing enter.',
  validateTag: null,
}

export default TagEditor
