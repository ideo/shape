import styled from 'styled-components'
import v from '~/utils/variables'

const StyledColumnFlexParent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  flex-wrap: wrap;
`

const StyledRowFlexParent = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
`

// flex-grow, flex-shrink and flex-basis combined
const StyledRowFlexItem = styled.div`
  width: 250px;
  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    /* width: 100px; */
  }
`

const StyledRowFlexCell = styled(StyledRowFlexItem)`
  width: 70px;
  padding-top: 15px;
  text-align: center;
  only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    width: 30px;
  }
`

const StyledRowFlexHeader = styled(StyledRowFlexCell)`
  padding-top: 0px;
`

const StyledLabelText = styled.span`
  margin-bottom: 0;
  margin-top: 15px;
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  letter-spacing: 0.05rem;
  display: inline;
  vertical-align: middle;
`

export {
  StyledRowFlexCell,
  StyledRowFlexItem,
  StyledRowFlexHeader,
  StyledRowFlexParent,
  StyledColumnFlexParent,
  StyledLabelText,
}
