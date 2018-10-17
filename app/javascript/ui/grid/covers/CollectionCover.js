import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Dotdotdot from 'react-dotdotdot'
import Hypher from 'hypher'
import english from 'hyphenation.en-us'

import v from '~/utils/variables'
import PlainLink from '~/ui/global/PlainLink'
import { CardHeading } from '~/ui/global/styled/typography'
import hexToRgba from '~/utils/hexToRgba'
import ProfileIcon from '~/ui/icons/ProfileIcon'
import FilledProfileIcon from '~/ui/icons/FilledProfileIcon'
import SubmissionBoxIconLg from '~/ui/icons/SubmissionBoxIconLg'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import TestCollectionIcon from '~/ui/icons/TestCollectionIcon'
import { routingStore } from '~/stores'

const IconHolder = styled.span`
  display: inline-block;
  line-height: 31px;
  margin-right: 5px;
  vertical-align: middle;
  width: 27px;
`

const StyledCollectionCover = styled.div`
  width: 100%;
  height: 100%;
  background: ${props =>
    props.isSpecialCollection ? v.colors.offset : v.colors.commonMedium};
  color: white;
  position: relative;
  overflow: hidden;
  ${props =>
    props.url &&
    `
    background-image: url(${props.url});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    color: white;
  `};
`
StyledCollectionCover.displayName = 'StyledCollectionCover'

const pad = 16
const calcSectionWidth = props => {
  if (props.width === 4) {
    return `${props.gridW * 2 - props.gutter * 1}px`
  } else if (props.width > 1) {
    return `${props.gridW - props.gutter * 2}px`
  }
  return `calc(100% - ${props.gutter * 2}px)`
}

const calcSectionHeight = props => {
  if (props.height > 1) {
    return `calc(50% - ${pad + props.gutter / 2}px)`
  }
  return `calc(50% - ${pad}px)`
}

const StyledCardContent = styled.div`
  .overlay {
    position: absolute;
    right: 0;
    top: 0;
    background: ${hexToRgba(v.colors.black, 0.4)};
    width: 100%;
    height: 100%;
  }
  .top,
  .bottom {
    position: absolute;
    right: 1.5rem;
    width: ${props => calcSectionWidth(props)};
    height: ${props => calcSectionHeight(props)};
  }
  .top {
    top: ${pad}px;
  }
  .bottom {
    bottom: ${props => (props.height === 1 ? `${pad / 2}` : pad)}px;
  }
  ${props =>
    props.width > 1 &&
    `
    top: 33%;
    left: 40%;
    padding-right: 2rem;
  `};
`
StyledCardContent.displayName = 'StyledCardContent'

const PositionedCardHeading = CardHeading.extend`
  bottom: 0;
  position: absolute;
`

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

function namePartTooLong(fullName) {
  const parts = fullName.split(' ')
  return parts.some(part => part.length > 14)
}

@inject('uiStore')
@observer
class CollectionCover extends React.Component {
  get hasIcon() {
    const { collection } = this.props
    return (
      collection.isTemplated ||
      collection.isMasterTemplate ||
      collection.isSubmissionBox ||
      collection.isTestCollectionOrTestDesign
    )
  }

  get name() {
    const { collection } = this.props
    const tooLong = namePartTooLong(collection.name)
    const hyphens = tooLong ? 'auto' : 'initial'
    if (this.hasIcon) {
      const nameParts = splitName(collection.name)
      if (!nameParts) return collection.name
      const lastName = nameParts.pop()
      let leftIcon
      let rightIcon
      if (collection.isProfileTemplate) {
        rightIcon = <FilledProfileIcon />
      } else if (collection.isMasterTemplate) {
        leftIcon = <TemplateIcon circled filled />
      } else if (collection.isUserProfile) {
        rightIcon = <ProfileIcon />
      } else if (collection.isTemplated) {
        rightIcon = <TemplateIcon circled />
      } else if (collection.isSubmissionBox) {
        rightIcon = <SubmissionBoxIconLg />
      } else if (collection.isTestCollectionOrTestDesign) {
        rightIcon = <TestCollectionIcon />
      }
      return (
        <span style={{ hyphens }}>
          {leftIcon && <IconHolder>{leftIcon}</IconHolder>}
          {nameParts.join(' ')}{' '}
          <span style={{ hyphens: tooLong ? 'auto' : 'initial' }}>
            {hyphenate(lastName)}
            &nbsp;
            {rightIcon && <IconHolder>{rightIcon}</IconHolder>}
          </span>
        </span>
      )
    }
    return <span style={{ hyphens }}>{collection.name}</span>
  }

  handleClick = e => {
    const { dragging } = this.props
    if (dragging) {
      e.preventDefault()
      return false
    }
    return true
  }

  render() {
    const { height, width, collection, uiStore, onClick } = this.props
    const { cover } = collection
    const { gridW, gutter } = uiStore.gridSettings

    return (
      <StyledCollectionCover
        data-cy="CollectionCover"
        url={cover.image_url}
        isSpecialCollection={collection.isSpecialCollection}
        // onClick can be null, is used by SearchResultsInfinite
        onClick={onClick}
      >
        <StyledCardContent
          height={height}
          width={width}
          gutter={gutter}
          gridW={gridW}
        >
          <div className="overlay" />
          <div className="top">
            <PositionedCardHeading>
              <Dotdotdot clamp={height > 1 ? 6 : 3}>
                <PlainLink
                  className="no-select"
                  onClick={this.handleClick}
                  to={routingStore.pathTo('collections', collection.id)}
                >
                  {this.name}
                </PlainLink>
              </Dotdotdot>
            </PositionedCardHeading>
          </div>
          <div className="bottom">
            <Dotdotdot clamp="auto">{cover.text}</Dotdotdot>
          </div>
        </StyledCardContent>
      </StyledCollectionCover>
    )
  }
}

CollectionCover.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  dragging: PropTypes.bool,
  onClick: PropTypes.func,
}
CollectionCover.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CollectionCover.defaultProps = {
  dragging: false,
  onClick: null,
}

CollectionCover.displayName = 'CollectionCover'

export default CollectionCover
