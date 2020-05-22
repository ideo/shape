import v from '~/utils/variables'
import styled from 'styled-components'

const IconHolder = styled.span`
  color: ${v.colors.commonDark};
  display: ${props => (props.display ? props.display : 'block')};
  height: ${props => (props.height ? props.height : 32)}px;
  ${props =>
    props.align === 'left' ? 'margin-right: 12px;' : 'margin-left: 6px;'}
  margin-top: ${props => (props.marginTop ? props.marginTop : 12)}px;
  overflow: hidden;
  width: ${props => (props.width ? props.width : 32)}px;

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    height: 36px;
    margin-top: 8px;
    width: 20px;
  }
`

export default IconHolder
