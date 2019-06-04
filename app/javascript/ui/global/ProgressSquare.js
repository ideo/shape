import PropTypes from 'prop-types'
import styled from 'styled-components'
import v from '~/utils/variables'

const Square = styled.div`
  background: ${v.colors.primaryDark};
  float: right;
  width: 40px;
  height: 40px;
  padding: 10px;
  border-radius: 7px;
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
    const fraction = `${currentProgress} / ${totalAmount}`

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
