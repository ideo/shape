import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Dotdotdot from 'react-dotdotdot'

import v from '~/utils/variables'
import PlainLink from '~/ui/global/PlainLink'
import { CardHeading } from '~/ui/global/styled/typography'
import hexToRgba from '~/utils/hexToRgba'
import ProfileIcon from '~/ui/icons/ProfileIcon'
import { routingStore } from '~/stores'

const IconHolder = styled.span`
  display: inline-block;
  height: 27px;
  vertical-align: text-top;
  width: 27px;
`

const StyledCollectionCover = styled.div`
  width: 100%;
  height: 100%;
  background: ${props => (props.isSpecialCollection ? v.colors.sirocco : v.colors.gray)};
  color: white;
  position: relative;
  overflow: hidden;
  ${props => (props.url && `
    background-image: url(${props.url});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    color: white;
  `
  )}
`
StyledCollectionCover.displayName = 'StyledCollectionCover'

const pad = 16
const calcSectionWidth = (props) => {
  if (props.width === 4) {
    return `${props.gridW * 2 - (props.gutter * 1)}px`
  } else if (props.width > 1) {
    return `${props.gridW - (props.gutter * 2)}px`
  }
  return `calc(100% - ${props.gutter * 2}px)`
}

const calcSectionHeight = (props) => {
  if (props.height > 1) {
    return `calc(50% - ${pad + (props.gutter / 2)}px)`
  }
  return `calc(50% - ${pad}px)`
}

const StyledCardContent = styled.div`
  .overlay {
    position: absolute;
    right: 0;
    top: 0;
    background: ${hexToRgba(v.colors.blackLava, 0.4)};
    width: 100%;
    height: 100%;
  }
  .top, .bottom {
    position: absolute;
    right: 1.5rem;
    width: ${props => calcSectionWidth(props)};
    height: ${props => calcSectionHeight(props)};
  }
  .top {
    top: ${pad}px;
    h3 {
      position: absolute;
      bottom: 0;
    }
  }
  .bottom {
    bottom: ${props => (props.height === 1 ? `${pad / 2}` : pad)}px;
  }
  ${props => (props.width > 1 && `
    top: 33%;
    left: 40%;
    padding-right: 2rem;
  `
  )}
`
StyledCardContent.displayName = 'StyledCardContent'

function splitName(name) {
  return name.split(' ')
}

@inject('uiStore')
@observer
class CollectionCover extends React.Component {
  get name() {
    const { collection } = this.props
    if (collection.isUserProfile) {
      const nameParts = splitName(collection.name)
      if (!nameParts) return collection.name
      const lastName = nameParts.pop()
      const name = (
        <Fragment>
          {nameParts.join(' ')}{' '}<span style={{ whiteSpace: 'nowrap' }}>
            {lastName}&nbsp;<IconHolder><ProfileIcon /></IconHolder></span>
        </Fragment>
      )
      return name
    }
    return collection.name
  }

  handleClick = (e) => {
    const { dragging } = this.props
    if (dragging) {
      e.preventDefault()
      return false
    }
    return true
  }

  render() {
    const { height, width, collection, uiStore } = this.props
    const { cover } = collection
    const { gridW, gutter } = uiStore.gridSettings

    return (
      <StyledCollectionCover
        url={cover.image_url}
        isSpecialCollection={collection.isSpecialCollection}
      >
        <StyledCardContent
          height={height}
          width={width}
          gutter={gutter}
          gridW={gridW}
        >
          <div className="overlay" />
          <div className="top">
            <CardHeading>
              <Dotdotdot clamp={height > 1 ? 6 : 3}>
                <PlainLink
                  noSelect
                  onClick={this.handleClick}
                  to={routingStore.pathTo('collections', collection.id)}
                >
                  {this.name}
                </PlainLink>
              </Dotdotdot>
            </CardHeading>
          </div>
          <div className="bottom">
            <Dotdotdot clamp="auto">
              {cover.text}
            </Dotdotdot>
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
}
CollectionCover.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CollectionCover.defaultProps = {
  dragging: false,
}

CollectionCover.displayName = 'CollectionCover'

export default CollectionCover
