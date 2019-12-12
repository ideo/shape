import CollectionTypeIcon from '~/ui/global/CollectionTypeIcon'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Hypher from 'hypher'
import english from 'hyphenation.en-us'
import CollectionTypeSelector from '~/ui/global/CollectionTypeSelector'

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

const IconHolder = styled.span`
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
    const { collection } = this.props

    return (
      collection.isTemplated ||
      collection.isMasterTemplate ||
      collection.isSubmissionBox ||
      collection.isTestCollectionOrResults
    )
  }

  get leftIcon() {
    const { collection } = this.props

    // if (collection.isMasterTemplate) {
    //   return <TemplateIcon circled filled />
    // }

    const leftConditions = [collection.isMasterTemplate]
    if (leftConditions.some(bool => bool)) {
      return <CollectionTypeIcon record={collection} />
    }
    return null
  }

  get rightIcon() {
    const { collection } = this.props

    const rightConditions = [
      collection.isSubmissionBox,
      collection.isTemplated,
      collection.isTestCollectionOrResults,
      collection.isUserProfile,
      collection.isProfileTemplate,
    ]

    if (rightConditions.some(bool => bool)) {
      return <CollectionTypeIcon record={collection} />
    }
    return null
  }

  render() {
    const { collection } = this.props
    const tooLong = namePartTooLong(collection.name)
    const hyphens = tooLong ? 'auto' : 'initial'

    if (this.hasIcon) {
      const nameParts = splitName(collection.name)
      if (!nameParts) return collection.name
      const lastName = nameParts.pop()

      return (
        <span style={{ hyphens }}>
          <IconHolder>{this.leftIcon}</IconHolder>
          {nameParts.join(' ')}{' '}
          <span style={{ hyphens: tooLong ? 'auto' : 'initial' }}>
            {hyphenate(lastName)}
            &nbsp;
            <CollectionTypeSelector collection={collection}>
              <IconHolder>{this.rightIcon}</IconHolder>
            </CollectionTypeSelector>
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
