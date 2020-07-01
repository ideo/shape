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
    const { label, internalType, user } = tagData
    const type = internalType === 'users' ? 'user_tag_list' : 'tag_list'

    const duplicateTag = _.find(formattedTags, t => {
      return t.label.toUpperCase() === label.toUpperCase() && t.type === type
    })

    // Return if duplicate tag is found
    if (duplicateTag) {
      return
    }

    // If a validateTag function is provided, validate tag
    if (validateTag) {
      const { tag, error } = validateTag(label)
      if (error) {
        setError(error)
        return
      } else {
        label = tag
      }
    }

    afterAddTag({ label, type, user })
  }

  const getReactTagProps = ({ index, label, type, user }) => {
    let symbol = null

    if (type === 'user_tag_list') {
      const { pic_url_square } = user
      symbol = <Avatar size={18} url={pic_url_square} />
    } else {
      symbol = creativeDifferenceTagIcon(label)
    }

    return {
      id: index,
      label,
      name: label,
      type,
      symbol,
      symbolSize: 18,
    }
  }

  _.each(formattedTags, t =>
    _.assign(t, {
      onDelete: () => {
        handleDelete({ label: t.label, type: t.type })
      },
    })
  )

  useEffect(() => {
    const _formattedTags = _.map(recordTags, ({ label, type, user }, index) =>
      getReactTagProps({ index, label, type, user })
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
  suggestions: PropTypes.array.isRequired,
  handleInputChange: PropTypes.func,
}

TagEditor.defaultProps = {
  canEdit: false,
  tagColor: 'gray',
  placeholder: 'Add new tags, separated by comma or pressing enter.',
  validateTag: null,
  handleInputChange: undefined,
}

export default TagEditor
