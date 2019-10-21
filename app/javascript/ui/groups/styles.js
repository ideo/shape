import styled from 'styled-components'

export const GroupIconContainer = styled.div`
  display: inline-block;
  height: 100%;
  width: ${props => (props.width ? props.width : '20px')};
  margin-left: ${props => (props.marginLeft ? props.marginLeft : '10px')};
  vertical-align: middle;
`
GroupIconContainer.displayName = 'GroupIconContainer'
