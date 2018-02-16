import styled from 'styled-components'

const StyledDragHandle = styled.div`
  z-index: 3;
  position: absolute;
  opacity: 0;
  transition: all 350ms;
  top: 0;
  height: 1rem;
  background: rgba(97, 177, 214, 0.15);
  width: 100%;
  cursor: move;
`

// explicit className is used for hover and for draggable to id it
const DragHandle = () => (
  <StyledDragHandle className="DragHandle" />
)

export default DragHandle
