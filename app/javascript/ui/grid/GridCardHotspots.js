import styled from 'styled-components'

import AddItemButton from '~/ui/grid/AddItemButton'

const StyledHotspot = styled.div`
  z-index: 2;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 350ms;
  background: rgba(0, 200, 0, 0.5);
  box-shadow: 1px 2px 10px rgba(0, 200, 0, 0.66);
  ${props => {
    if (props.position === 'right') {
      return `
        right: -10px;
        height: 100%;
        width: 1.1rem;
        button {
          height: 50px;
        }
      `
    }
    return ''
  }}
  &:hover, &.is-over {
    opacity: 1;
  }

`

const Hotspot = (props) => (
  <StyledHotspot position="right">
    <AddItemButton
      add={props.add}
      collectionId={props.parentId}
      order={props.order + 1}
    />
  </StyledHotspot>
)

class GridCardHotspots extends React.PureComponent {
  render() {
    const { card } = this.props
    return (
      <Hotspot order={card.order} />
    )
  }
}

export default GridCardHotspots
