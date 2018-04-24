import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Flex } from 'reflexbox'
import Loader from '~/ui/layout/Loader'
import v, { ITEM_TYPES } from '~/utils/variables'

const StyledFlex = styled(Flex)`
  background: rgba(255, 255, 255, 0.5);
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
  z-index: ${v.zIndex.gridCard};
`

const InlineLoader = () => (
  <StyledFlex align="center" justify="center">
    <Loader fadeIn="half" height="30px" size={30} />
  </StyledFlex>
)

InlineLoader.propTypes = {
}
InlineLoader.defaultProps = {
}

export default InlineLoader
