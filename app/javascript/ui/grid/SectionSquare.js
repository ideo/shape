import styled from 'styled-components'
import v from '~/utils/variables'

const SelectedAreaSquare = styled.div.attrs(({ coords }) => ({
  style: {
    left: `${coords.left}px`,
    top: `${coords.top}px`,
    height: `${coords.height}px`,
    width: `${coords.width}px`,
  },
}))`
  background-color: blue;
  border: 3px solid black;
  display: block;
  position: absolute;
  z-index: ${v.zIndex.clickWrapper};
`

const SectionSquare = props => <SelectedAreaSquare coords={props} />

export default SectionSquare
