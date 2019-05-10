import PropTypes from 'prop-types'
import styled from 'styled-components'
import AirplaneImg from '~/assets/paper-airplane.png'

const PaperAirplaneWrapper = styled.div`
  display: flex;
  justify-content: center; /* align horizontal */
  align-items: center;
`

const PaperAirplane = () => (
  <PaperAirplaneWrapper>
    <img src={AirplaneImg} alt="paper airplane" style={{ width: '14rem' }} />
  </PaperAirplaneWrapper>
)

export default PaperAirplane
