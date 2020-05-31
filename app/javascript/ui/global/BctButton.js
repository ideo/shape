import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'

const BctButton = styled.button`
  position: relative;
  width: 47px;
  height: 47px;
  border-radius: 50%;
  background: ${v.colors.black};
  color: white;

  left: ${props => (props.creating ? '100px' : 0)};
  @media only screen and (min-width: ${v.responsive
      .medBreakpoint}px) and (max-width: ${v.responsive.largeBreakpoint}px) {
    left: ${props => (props.creating ? '80px' : 0)};
  }
  transform: ${props => (props.creating ? 'rotate(360deg)' : 'none')};

  &:hover {
    background-color: ${v.colors.commonDark};
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
