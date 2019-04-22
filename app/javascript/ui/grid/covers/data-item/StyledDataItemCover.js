import styled from 'styled-components'
import v from '~/utils/variables'

const StyledDataItemCover = styled.div`
  background-color: ${v.colors.commonLight};
  border-top: 2px solid ${v.colors.black};
  height: calc(100% - 15px);
  padding: 15px 0 0;
  text-align: left;

  .editableMetric {
    ${props =>
      props.editable &&
      `
    &:hover {
      background-color: ${v.colors.primaryLight};
    }
    ${props.editing &&
      `
      background-color: ${v.colors.primaryLight};
`};
`};
  }
`
StyledDataItemCover.displayName = 'StyledDataItemCover'

export default StyledDataItemCover
