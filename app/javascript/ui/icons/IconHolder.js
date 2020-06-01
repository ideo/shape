import v from '~/utils/variables'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const IconHolder = styled.span`
  color: ${v.colors.commonDark};
  display: ${props => props.display};
  height: ${props => props.height}px;
  margin-top: ${props => props.marginTop}px;
  margin-left: ${props => props.marginLeft}px;
  margin-right: ${props => props.marginRight}px;
  overflow: hidden;
  width: ${props => props.width}px;

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    height: 36px;
    margin-top: 8px;
    width: 20px;
  }
`

IconHolder.propTypes = {
  display: PropTypes.string,
  height: PropTypes.number,
  width: PropTypes.number,
  marginTop: PropTypes.number,
  marginLeft: PropTypes.number,
  marginRight: PropTypes.number,
}

IconHolder.defaultProps = {
  display: 'block',
  height: 32,
  width: 32,
  marginTop: 12,
  marginLeft: 0,
  marginRight: 0,
}

export default IconHolder
