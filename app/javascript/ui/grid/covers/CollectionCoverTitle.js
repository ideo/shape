import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { PropTypes as MobxPropTypes, observer } from 'mobx-react'
import english from 'hyphenation.en-us'
import Hypher from 'hypher'
import styled from 'styled-components'
import { some } from 'lodash'

import CollectionTypeIcon from '~/ui/global/CollectionTypeIcon'
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

  get renderTitle() {
    const { title } = this.props
    if (!this.hasIcon) return title

    const nameParts = splitName(title)
    if (!nameParts) return title

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
          <TextWithBackground>{this.renderTitle}</TextWithBackground>
        ) : (
          this.renderTitle
        )}
      </span>
    )
  }
}

CollectionCoverTitle.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  useTextBackground: PropTypes.bool,
  onCollectionClick: PropTypes.func,
  title: PropTypes.string,
}

CollectionCoverTitle.defaultProps = {
  useTextBackground: false,
  onCollectionClick: null,
  title: null,
}

export default CollectionCoverTitle
