import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'

import hexToRgba from '~/utils/hexToRgba'
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

export const BctButton = styled.button`
  position: relative;
  width: 47px;
  height: 47px;
  border-radius: 50%;
  background: ${v.colors.black};
  color: white;

  left: ${props => (props.creating ? '100px' : 0)};
  @media only screen and (min-width: ${v.responsive
      .medBreakpoint}px) and (max-width: ${v.responsive.largeBreakpoint}px) {
    left: ${props => (props.creating ? '80px' : 0)};
  }
  transform: ${props => (props.creating ? 'rotate(360deg)' : 'none')};

  &:hover {
    background-color: ${v.colors.commonDark};
  }

  .icon {
    position: absolute;
    left: 0;
    top: 0;
    width: 47px;
    height: 47px;
  }
`
BctButton.displayName = 'BctButton'

export const StyledGridCard = styled.div`
  background: ${props => props.background || 'white'};
  box-shadow: ${props =>
    props.dragging ? '1px 1px 5px 2px rgba(0, 0, 0, 0.25)' : ''};
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
  z-index: 1;
  ${props =>
    props.selected &&
    `
  &:before {
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
  `};
  ${props =>
    props.draggingMultiple &&
    `
      box-shadow: -10px 10px 0 0px ${v.colors.secondaryLight};
    `};
`
StyledGridCard.displayName = 'StyledGridCard'

export const StyledCardWrapper = styled.div`
  z-index: ${props => props.zIndex};
  /* this is for both the ResizeIcon (in this component) and CardMenu (in GridCard) */
  .show-on-hover {
    opacity: 0;
    transition: opacity 0.25s;
  }
  &:hover {
    z-index: ${props => props.zIndex};
  }
  &:hover,
  &.touch-device {
    .show-on-hover {
      /* don't show hover items while dragging */
      opacity: ${props => (props.dragging ? 0 : 1)};
    }
  }
`
StyledCardWrapper.defaultProps = {
  zIndex: 1,
}

export const StyledBottomLeftIcon = styled.div`
  position: absolute;
  z-index: ${v.zIndex.gridCard};
  left: 0.25rem;
  bottom: 0;
  color: ${v.colors.commonMedium};
  width: ${props => (props.iconAmount === 2 ? 75 : 45)}px;
  height: 45px;
  display: flex;
  /* LinkIcon appears larger than CollectionIcon so we need to make it smaller */
  ${props =>
    props.small &&
    `
    width: 18px;
    height: 18px;
    bottom: 0.75rem;
    left: ${props.iconPos === 2 ? 3.25 : 0.75}rem;
  `};
`
StyledBottomLeftIcon.displayName = 'StyledBottomLeftIcon'

export const StyledGridCardInner = styled.div`
  position: relative;
  height: 100%;
  ${props =>
    !props.hasOverflow &&
    `
  overflow: hidden;
  `} z-index: 1;
  /*
  // related to userSelectHack from Rnd / Draggable
  // disable blue text selection on Draggables
  // https://github.com/bokuweb/react-rnd/issues/199
  */
  *::selection {
    background: transparent;
  }

  .overlay {
    position: absolute;
    right: 0;
    top: 0;
    ${props =>
      (props.filter === 'transparent_gray' || props.forceFilter) &&
      `
      background: ${hexToRgba(v.colors.black, 0.4)};
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
  height: 34px;
  right: 0.25rem;

  .selected {
    border-color: ${props => props.color};
    background-color: ${props => props.color};
  }
  .card-menu {
    color: ${props => props.color};
    display: inline-block;
    vertical-align: top;
    z-index: ${v.zIndex.gridCardTop};
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

export class GridCardIconWithName extends React.PureComponent {
  render() {
    const { icon, text } = this.props
    return (
      <Container>
        <IconHolder>{icon}</IconHolder>
        <Truncator text={text} key={text} extraSpacing={80} />
      </Container>
    )
  }
}
GridCardIconWithName.propTypes = {
  text: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
}
