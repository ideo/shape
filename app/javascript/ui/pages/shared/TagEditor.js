import PropTypes from 'prop-types'
import { action, observable, computed, runInAction } from 'mobx'
import { observer } from 'mobx-react'

import _ from 'lodash'
import ReactTags from 'react-tag-autocomplete'

import Pill from '~/ui/global/Pill'
import StyledReactTags, {
  creativeDifferenceTagIcon,
} from '~/ui/pages/shared/StyledReactTags'

// FIXME: tagsInCommon is used in TagEditor.unit.test.js
// export const tagsInCommon = (records, tagField) => {
//   const tags = []
//   records.forEach(record => {
//     // Include records with and without tags,
//     // because they are used to find if records share tags in common
//     // FIXME: adding user tags by default since there isn't a way to add it distinctively
//     const userTags = _.map(toJS(record['user_list']), t => {
//       return { label: t, type: 'user_list' }
//     })
//     const regularTags = _.map(toJS(record[tagField]), t => {
//       return { label: t, type: tagField }
//     })
//     tags.push([...userTags, ...regularTags])
//   })
//   // Intersection needs each array as separate arguments,
//   // which is why apply is used
//   return _.intersection.apply(null, tags)
// }

@observer
class TagEditor extends React.Component {
  @observable
  error = ''

  constructor(props) {
    super(props)
    // this.initTagFields(props.records, props.tagField)
  }

  componentWillReceiveProps(nextProps) {
    // this.initTagFields(nextProps.records, nextProps.tagField)
  }

  // initTagFields(records, tagField) {
  //   records.forEach(record => {
  // should be some kind of error if tagField doesn't exist
  // if (!record[tagField]) record[tagField] = []
  // })
  // Init with tags that are shared across all records
  // this.initTags(tagsInCommon(records, tagField))
  // }

  @computed
  get formattedTags() {
    const { recordTags } = this.props
    return _.map(recordTags, t => this.createFormattedTag(t))
  }

  createFormattedTag(tag) {
    const _tag = {
      id: tag,
      label: tag,
      name: tag,
      type: null,
      onDelete: this.handleDelete(tag),
      symbol: creativeDifferenceTagIcon(tag),
      symbolSize: 18,
    }
    return _tag
  }

  // @action
  // initTags = tagArray => {
  //   // `id` is used by react-tag-autocomplete, but otherwise doesn't hold any meaning
  //   this.tags = _.map([...tagArray], t => this.createFormattedTag(t))
  // }

  @action
  handleAddition = tagData => {
    const { validateTag, tagField, afterAddTag } = this.props
    tagData.name = tagData.name.trim()
    // FIXME: handle user tagField
    const newTag = this.createFormattedTag({
      label: tagData.name,
      type: tagField,
    })
    this.error = ''

    // FIXME: use once we can distinguish by tagFields/type (for users)
    // _.find(this.tags, { label, type })

    // Return if tag is a duplicate
    if (
      _.find(this.tags, t => t.name.toUpperCase() === newTag.name.toUpperCase())
    ) {
      return
    }

    // If a validateTag function is provided, validate tag
    if (validateTag) {
      const { tag, error } = validateTag(newTag.name)
      if (error) {
        this.error = error
        return
      } else {
        newTag.name = tag
      }
    }
    this.tags.push(newTag)
    // records.forEach(record => {
    // persist the tag locally on the Item/Collection
    // record[tagField].push(newTag.name)
    // })
    const { label, type } = newTag
    afterAddTag({ label, type })
  }

  handleDelete = label => e => {
    const { afterRemoveTag } = this.props

    // FIXME: use once we can distinguish by tagFields/type
    // _.find(this.tags, { label, type })

    const tag = _.find(this.tags, { label })
    if (tag) {
      runInAction(() => {
        this.tags.remove(tag)
        // records.forEach(record => {
        // record[tagField].remove(tag.name)
        // })
        const { label, type } = tag
        afterRemoveTag({ label, type })
      })
    }
  }

  // This is displayed instead of the tag input if the user cannot edit the tags
  readonlyTags = () => {
    if (this.tags.length === 0) {
      return 'No tags added.'
    }
    return (
      <div className="react-tags__selected">
        {this.tags.map(tag => (
          <Pill key={tag.id} tag={tag} />
        ))}
      </div>
    )
  }

  render() {
    const { canEdit, placeholder, tagColor } = this.props

    return (
      <StyledReactTags tagColor={tagColor}>
        {!canEdit && this.readonlyTags()}
        {canEdit && (
          <ReactTags
            tags={[...this.formattedTags]}
            allowBackspace={false}
            delimiterChars={[',']}
            placeholder={placeholder}
            handleAddition={this.handleAddition}
            handleDelete={this.handleDelete}
            tagComponent={Pill}
            allowNew
          />
        )}
        {this.error && <div className="error">{this.error}</div>}
      </StyledReactTags>
    )
  }
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
