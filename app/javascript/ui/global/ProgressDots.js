import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'

const DotContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  height: auto;
  align-items: center;
  margin-left: -35px;
  margin-top: calc(10%);
  position: fixed;
  width: 20px;
`

const Dot = styled.div`
  background-color: ${({ isCurrent }) =>
    isCurrent ? v.colors.primaryDark : v.colors.commonMedium};
  border-radius: 50%;
  display: block;
  height: ${({ scaleDown }) => 12 / (scaleDown + 1)}px;
  margin-bottom: 12px;
  width: ${({ scaleDown }) => 12 / (scaleDown + 1)}px;
`

Dot.propTypes = {
  isCurrent: PropTypes.bool,
}
Dot.defaultProps = {
  isCurrent: false,
}

class ProgressDots extends React.Component {
  render() {
    const { currentProgress, totalAmount } = this.props
    return (
      <DotContainer>
        {[...Array(totalAmount)].map((_, i) => {
          const positionsFromCurrent = Math.min(
            Math.abs(i - currentProgress),
            2
          )
          const scale =
            positionsFromCurrent === 0 ? 0 : positionsFromCurrent / 2
          return (
            <Dot key={i} isCurrent={i === currentProgress} scaleDown={scale} />
          )
        })}
      </DotContainer>
    )
  }
}

ProgressDots.propTypes = {
  currentProgress: PropTypes.number,
  totalAmount: PropTypes.number,
}
ProgressDots.defaultProps = {
  currentProgress: 0,
  totalAmount: 2,
}
export default ProgressDots
