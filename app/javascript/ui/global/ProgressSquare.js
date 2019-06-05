import PropTypes from 'prop-types'
import styled from 'styled-components'
import v from '~/utils/variables'

const Square = styled.div`
  background: ${v.colors.primaryDark};
  width: 40px;
  height: 40px;
  padding: 10px;
  border-radius: 7px;
  margin-left: calc(75%);
  top: calc(2%);
  position: fixed;
  z-index: 2;
  box-shadow: 0px 0px 12px -2px rgba(0, 0, 0, 0.33);
  @media only screen and (min-width: ${v.responsive.medBreakpoint}px) {
    display: none;
  }
  div {
    line-height: 40px;
    text-align: center;
    font-family: Gotham;
    font-size: 1rem;
    color: #f2f1ee;
  }
`

class ProgressSquare extends React.Component {
  render() {
    const { currentProgress, totalAmount } = this.props
    const fraction = `${currentProgress + 1} / ${totalAmount}`

    return (
      <div>
        <Square>
          <div>{fraction}</div>
        </Square>
      </div>
    )
  }
}

ProgressSquare.propTypes = {
  currentProgress: PropTypes.number,
  totalAmount: PropTypes.number,
}
ProgressSquare.defaultProps = {
  currentProgress: 0,
  totalAmount: 2,
}
export default ProgressSquare
