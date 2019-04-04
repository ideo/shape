import PropTypes from 'prop-types'
import styled from 'styled-components'
import { uiStore } from '~/stores'
import v from '~/utils/variables'

const StyledContainer = styled.main`
  display: block;
  ${props =>
    !props.fullWidth &&
    `
    max-width: ${v.maxWidth}px;
  `}
  margin: ${props => props.marginTop}px auto 0;
  padding: 0 ${v.containerPadding.horizontal}rem;
  position: relative;
`

const PageContainer = ({ children, fullWidth, marginTop }) => (
  <StyledContainer
    onClick={uiStore.deselectCards}
    marginTop={marginTop}
    fullWidth={fullWidth}
  >
    {children}
  </StyledContainer>
)

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
  marginTop: PropTypes.number,
  fullWidth: PropTypes.bool,
}

PageContainer.defaultProps = {
  marginTop: v.headerHeight,
  fullWidth: false,
}

export default PageContainer
