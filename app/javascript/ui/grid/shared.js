import PropTypes from 'prop-types'
import styled from 'styled-components'

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
  z-index: 1;
  position: relative;
  height: 100%;
  width: 100%;
  background: white;
  padding: 0;
  cursor: ${props => {
    if (props.dragging) return 'grabbing'
    else if (props.testCollectionCard) return 'auto'
    return 'pointer'
  }};
  box-shadow: ${props =>
    props.dragging ? '1px 1px 5px 2px rgba(0, 0, 0, 0.25)' : ''};
  opacity: ${props => (props.dragging ? '0.95' : '1')};
`
StyledGridCard.displayName = 'StyledGridCard'

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
    left: 0.75rem;
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
`
StyledGridCardInner.displayName = 'StyledGridCardInner'

export const StyledTopRightActions = styled.div`
  align-items: center;
  background-color: ${v.colors.commonLightest};
  border-radius: 4px;
  display: flex;
  height: 34px;
  position: absolute;
  right: 0.25rem;
  top: 0.35rem;
  z-index: ${v.zIndex.gridCardTop};

  .show-on-hover {
    border-color: ${props => props.color};
    color: ${props => props.color};
  }

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
