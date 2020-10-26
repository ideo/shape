import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'

const BctButton = styled.button`
  height: 36px;
  margin-bottom: 10px;
  position: relative;
  width: 36px;

  left: 0;
  @media only screen and (min-width: ${v.responsive
      .medBreakpoint}px) and (max-width: ${v.responsive.largeBreakpoint}px) {
    left: 0;
  }

  .icon {
    position: absolute;
    left: 0;
    top: 0;
    width: 47px;
    height: 47px;
  }
`
BctButton.displayName = 'BctButton'
BctButton.propTypes = {
  creating: PropTypes.bool,
}
BctButton.defaultProps = {
  creating: false,
}
export default BctButton
