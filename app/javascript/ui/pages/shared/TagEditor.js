import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

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
  suggestions,
  canEdit,
  tagColor,
  placeholder,
  validateTag,
  handleInputChange,
}) => {
  const [error, setError] = useState('')
  const [formattedTags, setFormattedTags] = useState([])

  const handleDelete = ({ label, type }) => {
    const tagToDelete = _.find(formattedTags, t => {
      return t.label.toUpperCase() === label.toUpperCase() && t.type === type
    })
    if (tagToDelete) {
      afterRemoveTag({ label, type })
    }
  }

  const handleAddition = tagData => {
    tagData.name = tagData.name.trim()

    const { name, internalType } = tagData

    // user_list and tag_list are record fields used for saving tags; add to tag_list by default
    const tagType = internalType === 'users' ? 'user_tag_list' : 'tag_list'

    const newTag = getFormattedTag({
      label: name,
      type: tagType,
    })

    const duplicateTag = _.find(formattedTags, t => {
      return (
        t.label.toUpperCase() === newTag.label.toUpperCase() &&
        t.type === newTag.type
      )
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

    const { label, type } = newTag
    afterAddTag({ label, type })
  }

  const getFormattedTag = ({ label, type }) => ({
    id: label,
    label,
    name: label,
    type,
    symbol:
      type !== 'user_tag_list' ? (
        creativeDifferenceTagIcon(label)
      ) : (
        <Avatar size={18} />
      ),
    symbolSize: 18,
  })

  _.each(formattedTags, t =>
    _.assign(t, {
      onDelete: () => {
        handleDelete({ label: t.label, type: t.type })
      },
    })
  )

  useEffect(() => {
    const _formattedTags = _.map(recordTags, ({ label, type }) =>
      getFormattedTag({ label, type })
    )

    // set onDelete once formatted tags are initialized since it uses formatted tags within the context
    _.each(_formattedTags, t =>
      _.assign(t, {
        onDelete: () => {
          handleDelete({ label: t.label, type: t.type })
        },
      })
    )
    setFormattedTags(_formattedTags)
  }, [recordTags])

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
          suggestions={suggestions}
          delimiterChars={[',']}
          placeholder={placeholder}
          handleAddition={handleAddition}
          handleDelete={handleDelete}
          handleInputChange={handleInputChange}
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
  canEdit: PropTypes.bool,
  tagColor: PropTypes.string,
  placeholder: PropTypes.string,
  validateTag: PropTypes.func,
  suggestions: MobxPropTypes.arrayOrObservableArray.isRequired,
  handleInputChange: PropTypes.func.isRequired,
}

TagEditor.defaultProps = {
  canEdit: false,
  tagColor: 'gray',
  placeholder: 'Add new tags, separated by comma or pressing enter.',
  validateTag: null,
}

export default TagEditor
