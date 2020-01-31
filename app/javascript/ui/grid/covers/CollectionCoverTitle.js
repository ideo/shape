import CollectionTypeIcon from '~/ui/global/CollectionTypeIcon'
import { PropTypes as MobxPropTypes, observer } from 'mobx-react'
import styled from 'styled-components'
import Hypher from 'hypher'
import english from 'hyphenation.en-us'
import { some } from 'lodash'

function namePartTooLong(fullName) {
  const parts = fullName.split(' ')
  return some(parts, part => part.length > 14)
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

export const IconHolder = styled.span`
  display: inline-block;
  line-height: 31px;
  margin-right: 5px;
  vertical-align: middle;
  width: 27px;
  height: 27px;
`

@observer
class CollectionCoverTitle extends React.Component {
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

    const leftConditions = [collection.isMasterTemplate]
    if (some(leftConditions, bool => bool)) {
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

    if (some(rightConditions, bool => bool)) {
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
          {this.leftIcon && <IconHolder>{this.leftIcon}</IconHolder>}
          {nameParts.join(' ')}{' '}
          <span style={{ hyphens: tooLong ? 'auto' : 'initial' }}>
            {hyphenate(lastName)}
            &nbsp;
            {this.rightIcon && <IconHolder>{this.rightIcon}</IconHolder>}
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
