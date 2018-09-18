import PropTypes from 'prop-types'
import styled from 'styled-components'

// TODO: local svg is not loading to/from webpacker. Will SMH when I figure out why.
const StyledHamburger = styled.div`
  margin-bottom: 15px;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-image: url('https://firebasestorage.googleapis.com/v0/b/shape-marketing.appspot.com/o/marketing%2Fcommon%2Fhamburger_menu.svg?alt=media&token=c0d38053-1cce-409f-978a-8ca80a381046')
}
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
`

const Hamburger = (props) => {
  const hamburgerProps = { ...props }
  return <StyledHamburger {...hamburgerProps} title="Menu" />
}

StyledHamburger.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
}
StyledHamburger.defaultProps = {
  width: 44,
  height: 44,
}

export default StyledHamburger
