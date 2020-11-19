import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'

import { hexToRgba } from '~/utils/colorUtils'
import v from '~/utils/variables'
import Truncator from 'react-truncator'

const Container = styled.div`
  align-items: center;
  bottom: 10px;
  color: ${v.colors.commonMedium};
  display: flex;
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  font-weight: 500;
  left: 15px;
  position: absolute;
  width: calc(100% - 15px);
`
const IconHolder = styled.div`
  background-color: ${v.colors.commonLight};
  border-radius: 50%;
  box-sizing: content-box;
  color: black;
  height: 18px;
  margin-right: 22px;
  overflow: hidden;
  padding: 7px;
  position: relative;
  width: 18px;

  img {
    left: 0;
    width: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
  }
`

export const StyledGridCardPrivate = styled.div`
  background: ${props => props.backgroundColor};
  text-align: center;
  color: ${v.colors.collectionCover};
  width: 100%;
  height: 100%;
  svg {
    width: 90px;
    display: inline;
    margin: auto;
  }
`
StyledGridCardPrivate.defaultProps = {
  backgroundColor: `${v.colors.commonMedium}`,
}
StyledGridCardPrivate.displayName = 'StyledGridCardPrivate'

export const highlightedCardCss = css`
  background: #5698ae;
  content: '';
  height: 100%;
  left: 0;
  opacity: 0.45;
  pointer-events: none;
  position: absolute;
  width: 100%;
  top: 0;
  z-index: 151;
`

export const StyledGridCard = styled.div`
  background: ${props => props.background || 'white'};
  cursor: ${props => {
    if (props.dragging) return 'grabbing'
    else if (props.unclickable) return 'auto'
    return 'pointer'
  }};
  height: 100%;
  // Attempt at an IE11 fix
  min-height: 100%;
  opacity: ${props => (props.dragging ? '0.75' : '1')};
  padding: 0;
  position: relative;
  width: 100%;
  /* box-shadow is used for collaborator and dragging */
  transition: box-shadow 0.6s;

  ${props => !props.inSearchPage && `z-index: 1`};

  ${props =>
    props.selected &&
    `
  &:before {
    ${highlightedCardCss}
  }
  `};

  ${props =>
    props.blocked &&
    `
    &:before {
      background: ${v.colors.alert}
    }
  `}

  ${props =>
    props.collaboratorColor &&
    `
    box-shadow: 0 0 0 3px ${props.collaboratorColor};
  `}
  ${props =>
    props.dragging &&
    `
    box-shadow: 1px 1px 5px 2px rgba(0, 0, 0, 0.25);
    transition: box-shadow 0s;
  `}
  ${props =>
    props.draggingMultiple &&
    `
      box-shadow: -10px 10px 0 0px ${v.colors.secondaryLight};
      transition: box-shadow 0s;
    `};
`
StyledGridCard.displayName = 'StyledGridCard'

export const showOnHoverCss = css`
  .hidden-actions {
    /* don't show hover items while editing a title or dragging selection square */
    visibility: hidden;
    .show-on-hover {
      visibility: hidden !important;
    }
  }
  .show-on-hover {
    visibility: hidden;
  }
  &:hover,
  &.touch-device {
    .show-on-hover {
      /* don't show hover items while dragging */
      visibility: ${props => (props.dragging ? 'hidden' : 'visible')};
    }
  }
`

export const hideOnHoverCss = css`
  .hide-on-hover {
    opacity: 1;
    transition: opacity 0.25s;
  }
  &:hover,
  &.touch-device {
    .hide-on-hover {
      /* don't show hover items while dragging */
      opacity: ${props => (props.dragging ? 1 : 0)};
    }
  }
`

const SECTION_THICKNESS = 100
const SECTION_BORDER = '4px solid black'

export const SectionCardWrapper = styled.div`
  height: 100%;
  width: 100%;
  background: ${props => props.backgroundColor};
  .sectionInner {
    position: absolute;
    cursor: grab;
    ${props =>
      props.selected &&
      `
    &:before {
      ${highlightedCardCss}
    }
    `};
  }

  .styled-name {
    /* just relative to .sectionInner this should be on top */
    z-index: 10;
    position: relative;
    top: 40px;
    left: 174px;
  }
`

SectionCardWrapper.propTypes = {
  /* for debugging: */
  /* backgroundColor: rgba(130, 125, 185, 0.1); */
  backgroundColor: PropTypes.string,
}

SectionCardWrapper.defaultProps = {
  backgroundColor: v.colors.transparent,
}

export const SectionTop = styled.div`
  border-top: ${SECTION_BORDER};
  width: 100%;
  height: ${SECTION_THICKNESS}px;
  top: 0;
  left: 0;
`
export const SectionBottom = styled.div`
  border-bottom: ${SECTION_BORDER};
  width: 100%;
  height: ${SECTION_THICKNESS}px;
  bottom: 0;
  left: 0;
`
export const SectionLeft = styled.div`
  border-left: ${SECTION_BORDER};
  height: 100%;
  width: ${SECTION_THICKNESS}px;
  top: 0;
  left: 0;
`
export const SectionRight = styled.div`
  border-right: ${SECTION_BORDER};
  height: 100%;
  width: ${SECTION_THICKNESS}px;
  top: 0;
  right: 0;
`

const mdlPillPlaceholderCss = css`
  position: fixed !important;

  ${props => {
    const { width, height, maxWidth, maxHeight, selectedMultiple } = props
    const { cardTiltDegrees, colors } = v
    const shouldScaleSmaller = maxWidth >= 2 && maxHeight >= 2 // scale even smaller for 2x2, 2x3 or 2x4 ratio
    const scalarTransform = shouldScaleSmaller ? 0.25 : 0.4
    const marginLeft = width / maxWidth

    return `
      height: ${height}px;
      width: ${width}px;
      left: 50%;
      margin-left: -${marginLeft}px;
      bottom: 40px;
      transform-origin: 0 100%;
      overflow: hidden;
      transform: rotate(${cardTiltDegrees}deg) scale(${scalarTransform});
      box-shadow: ${
        selectedMultiple ? `-15px 15px 0 0px ${colors.secondaryLight}` : 'none'
      };
      @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
        left: 5%;
        margin: 0;
      }
    `
  }}

  /* hide hover actions */
  .show-on-hover {
    display: none;
  }
  .react-draggable:before {
    background: ${v.colors.primaryDark};
    content: '';
    height: 100%;
    left: 0;
    opacity: 0.45;
    pointer-events: none;
    position: absolute;
    width: 100%;
    top: 0;
    z-index: ${v.zIndex.gridCardTop};
  }
`

export const StyledCardWrapper = styled.div`
  ${showOnHoverCss};
  z-index: ${props => props.zIndex};
  &:hover {
    z-index: ${props => props.zIndex + 1};
  }
  ${props => props.dragging && 'position: absolute;'}
  ${props => props.hidden && 'display: none;'}
  ${props => props.moving && mdlPillPlaceholderCss}
  /* NOTE: for react draggable to scroll when dragging on a touch device, may not work for IE */
  /* See: https://github.com/mzabriskie/react-draggable/issues/227 */
  ${props =>
    props.allowTouchAction &&
    `
    .react-draggable {
      touch-action: auto !important;
    }
    `}
`
StyledCardWrapper.defaultProps = {
  zIndex: 1,
}

export const StyledGridCardInner = styled.div`
  position: relative;
  height: 100%;
  ${props =>
    !props.hasOverflow &&
    `
  overflow: ${props.visibleOverflow ? 'visible' : 'hidden'};
  `} z-index: 1;
  ${props =>
    !props.isText &&
    `
      /*
      // related to userSelectHack from Rnd / Draggable
      // disable blue text selection on Draggables
      // https://github.com/bokuweb/react-rnd/issues/199

      // TODO: always disable this, even for text, while anything is being dragged?
      */
      *::selection {
        background: transparent;
      }
      user-select: none;
    `}

  ${props =>
    props.isText &&
    `
    @media print {
      border: 1px solid ${v.colors.commonLight};
    }
  `} .overlay {
    position: absolute;
    right: 0;
    top: 0;
    ${props =>
      (props.filter === 'transparent_gray' || props.forceFilter) &&
      `
      background: ${hexToRgba(v.colors.black, v.collectionCoverOpacity)};
    `} width: 100%;
    height: 100%;
  }
`
StyledGridCardInner.displayName = 'StyledGridCardInner'

const TopActions = css`
  align-items: center;
  cursor: pointer;
  display: flex;
  position: absolute;
  top: 0.35rem;
  z-index: ${v.zIndex.popoutMenu};
`
export const StyledTopLeftActions = styled.div`
  ${TopActions};
  left: 0.25rem;
`

export const StyledTopRightActions = styled.div`
  ${TopActions};
  background-color: ${v.colors.commonLightest};
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  height: 34px;
  right: 0.25rem;
  top: ${props => 2 * props.zoomLevel}px;
  transform: scale(${props => props.zoomLevel});
  transform-origin: top right;

  ${props =>
    props.smallCard &&
    `
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    right: 0;
    top: ${-36 * props.zoomLevel}px;

    &:after {
      background: transparent;
      content: ' ';
      display: block;
      height: 6px;
      position: absolute;
      top: calc(100% - 1px);
      width: 100%;
    }
  `}

  ${props =>
    props.forceOpen &&
    `
      visibility: visible !important;
      z-index: ${v.zIndex.popoutMenu};

      .show-on-hover {
        visibility: visible !important;
        z-index: ${v.zIndex.popoutMenu};
      }
  `}

  .selected {
    border-color: ${props => props.color};
    background-color: ${props => props.color};
  }
  .card-menu {
    color: ${props => props.color};
    display: inline-block;
    vertical-align: top;
    z-index: ${v.zIndex.gridCardTop};
    &.open {
      visibility: visible;
    }
  }

  svg {
    &:hover {
      svg: ${v.colors.black};
    }
  }
`
StyledTopRightActions.defaultProps = {
  color: v.colors.commonMedium,
}
StyledTopRightActions.displayName = 'StyledTopRightActions'

export const BottomRightActionHolder = styled.div`
  bottom: 28px;
  right: 10px;
  position: absolute;
  z-index: ${v.zIndex.gridCardTop};
`

export const StyledFileCover = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: ${v.colors.commonMedium};

  .fileInfo {
    align-items: center;
    bottom: 0;
    color: ${v.colors.commonMedium};
    display: flex;
    font-family: ${v.fonts.sans};
    font-size: 1rem;
    font-weight: 500;
    left: 0;
    max-height: 32px;
    position: absolute;
    width: 95%;
  }
  .fileName {
    display: inline-block;
    width: 75%;
    white-space: nowrap;
  }
  .card-menu {
    border-color: ${v.colors.black};
    color: ${v.colors.black};
  }
`
StyledFileCover.displayName = 'StyledFileCover'

export class GridCardIconWithName extends React.PureComponent {
  render() {
    const { icon, text } = this.props
    return (
      <Container>
        <IconHolder>{icon}</IconHolder>
        {text && <Truncator text={text} key={text} extraSpacing={80} />}
      </Container>
    )
  }
}
GridCardIconWithName.propTypes = {
  text: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
}
