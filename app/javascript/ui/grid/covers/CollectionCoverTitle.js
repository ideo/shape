import CollectionTypeIcon from '~/ui/global/CollectionTypeIcon'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { css } from 'styled-components'
import Hypher from 'hypher'
import english from 'hyphenation.en-us'
import TestCollectionIcon from '~/ui/icons/TestCollectionIcon'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import SubmissionBoxIconLg from '~/ui/icons/SubmissionBoxIconLg'
import FilledProfileIcon from '~/ui/icons/FilledProfileIcon'
import ProfileIcon from '~/ui/icons/ProfileIcon'

function namePartTooLong(fullName) {
  const parts = fullName.split(' ')
  return parts.some(part => part.length > 14)
}

function splitName(name) {
  return name.split(' ')
}

const Hyphy = new Hypher(english)
function hyphenate(namePart) {
  const hyphenated = Hyphy.hyphenateText(namePart, 14)
  // u00AD is the "soft" hyphenation character Hypher uses
  if (!hyphenated.includes('\u00AD')) return namePart
  const parts = hyphenated.split('\u00AD')
  return `${parts.slice(0, -1).join('')}\u00AD${parts.slice(-1)}`
}

const IconHolderCss = css`
  display: inline-block;
  line-height: 31px;
  margin-right: 5px;
  vertical-align: middle;
  width: 27px;
`

class CollectionCoverTitle extends React.Component {
  constructor(props) {
    super(props)
  }

  get hasIcon() {
    return this.isSpecialCollection // should this always true now?
  }

  get isSpecialCollection() {
    const { collection } = this.props
    return (
      collection.isTemplated ||
      collection.isMasterTemplate ||
      collection.isSubmissionBox ||
      collection.isTestCollectionOrResults
    )
  }

  get collectionName() {}

  render() {
    const { collection } = this.props
    const tooLong = namePartTooLong(collection.name)
    const hyphens = tooLong ? 'auto' : 'initial'
    if (this.hasIcon) {
      const nameParts = splitName(collection.name)
      if (!nameParts) return collection.name
      const lastName = nameParts.pop()
      let leftIcon
      let rightIcon
      this.isSpecialCollection ? (
        <div>foo</div>
      ) : (
        // <SpecialTemplateIcon record={collection} />
        <CollectionTypeIcon record={collection} />
      )
      if (collection.isProfileTemplate) {
        rightIcon = <FilledProfileIcon />
      } else if (collection.isMasterTemplate) {
        leftIcon = <TemplateIcon circled filled />
      } else if (collection.isUserProfile) {
        rightIcon = <ProfileIcon />
      } else if (collection.isTestCollectionOrResults) {
        rightIcon = <TestCollectionIcon />
      } else if (collection.isTemplated) {
        rightIcon = <TemplateIcon circled />
      } else if (collection.isSubmissionBox) {
        rightIcon = <SubmissionBoxIconLg />
      }
      return (
        <span style={{ hyphens }}>
          {leftIcon && (
            <CollectionTypeIcon
              css={IconHolderCss}
              record={collection}
            ></CollectionTypeIcon>
          )}
          {nameParts.join(' ')}{' '}
          <span style={{ hyphens: tooLong ? 'auto' : 'initial' }}>
            {hyphenate(lastName)}
            &nbsp;
            {rightIcon && (
              <CollectionTypeIcon
                css={IconHolderCss}
                record={collection}
              ></CollectionTypeIcon>
            )}
          </span>
        </span>
      )
    }
    return <span style={{ hyphens }}>{collection.name}</span>
  }
}

CollectionCoverTitle.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionCoverTitle
