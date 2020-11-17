import styled from 'styled-components'
import v from '~/utils/variables'

const SelectedAreaSquare = styled.div.attrs(({ left, height, top, width }) => ({
  style: {
    left: `${left}px`,
    top: `${top}px`,
    height: `${height}px`,
    width: `${width}px`,
  },
}))`
  border: 3px solid black;
  display: block;
  position: absolute;
  z-index: ${v.zIndex.clickWrapper};

  ${props =>
    props.transition &&
    `
    transition: top 0.25s, left 0.25s, width 0.25s, height 0.25s;
  `}
`

const SectionSquare = props => <SelectedAreaSquare {...props} />

export default SectionSquare
