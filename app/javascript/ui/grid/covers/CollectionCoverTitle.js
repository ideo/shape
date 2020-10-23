import CollectionTypeIcon from '~/ui/global/CollectionTypeIcon'
import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { PropTypes as MobxPropTypes, observer } from 'mobx-react'
import styled from 'styled-components'
import Hypher from 'hypher'
import english from 'hyphenation.en-us'
import { some } from 'lodash'
import { TextWithBackground } from './CollectionCover'

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
    ]

    if (some(rightConditions, bool => bool)) {
      return <CollectionTypeIcon record={collection} />
    }
    return null
  }

  get name() {
    const { title } = this.props
    const {
      collection: { name },
    } = this.props

    if (title) return title

    return name
  }

  get renderName() {
    const { name } = this
    if (!this.hasIcon) return name

    const nameParts = splitName(name)
    if (!nameParts) return name

    const lastName = nameParts.pop()
    return (
      <Fragment>
        {this.leftIcon && <IconHolder>{this.leftIcon}</IconHolder>}
        {nameParts.join(' ')}{' '}
        <span style={{ hyphens: this.tooLong ? 'auto' : 'initial' }}>
          {hyphenate(lastName)}
          &nbsp;
          {this.rightIcon && <IconHolder>{this.rightIcon}</IconHolder>}
        </span>
      </Fragment>
    )
  }

  render() {
    const { useTextBackground } = this.props
    const hyphens = this.tooLong ? 'auto' : 'initial'
    return (
      <span style={{ hyphens }}>
        {useTextBackground ? (
          <TextWithBackground>{this.renderName}</TextWithBackground>
        ) : (
          this.renderName
        )}
      </span>
    )
  }
}

CollectionCoverTitle.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  useTextBackground: PropTypes.bool,
  title: PropTypes.string,
}

CollectionCoverTitle.defaultProps = {
  useTextBackground: false,
  title: null,
}

export default CollectionCoverTitle
