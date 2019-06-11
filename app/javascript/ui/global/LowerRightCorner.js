import styled from 'styled-components'

import v from '~/utils/variables'

export const CLASS_LOWER_RIGHT_CORNER = 'lower-right-corner'

const CornerPositioned = styled.div`
  bottom: 15px;
  right: 15px;
  position: fixed;
  z-index: ${v.zIndex.activityLog};

  & > * {
    margin-bottom: 10px;
  }
`

const LowerRightCorner = () => (
  <CornerPositioned className={CLASS_LOWER_RIGHT_CORNER} />
)
export default LowerRightCorner
