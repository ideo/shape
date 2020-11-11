import PropTypes from 'prop-types'
import styled from 'styled-components'

const SectionCoverWrapper = styled.div`
  height: 100%;
`

const SectionBorder = styled.div`
  height: 100%;
  ${props =>
    props.borderSize &&
    `
    margin-top: ${props.borderSize}px;
    margin-right: ${props.borderSize}px;
    margin-bottom: ${props.borderSize + 10}px;
    margin-left: ${props.borderSize}px;
    box-shadow: 0 0 0 ${props.borderSize}px black;
  `}
`

const SectionCover = ({ borderSize }) => {
  return (
    <SectionCoverWrapper>
      <SectionBorder borderSize={borderSize} />
    </SectionCoverWrapper>
  )
}

SectionCover.propTypes = {
  borderSize: PropTypes.number.isRequired,
}

export default SectionCover
