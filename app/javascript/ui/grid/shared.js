import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'
import Truncator from 'react-truncator'

const Container = styled.div`
  align-items: center;
  bottom: 10px;
  color: ${v.colors.gray};
  display: flex;
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  font-weight: 500;
  left: 15px;
  position: absolute;
  width: calc(100% - 15px);
`
const IconHolder = styled.div`
  background-color: ${v.colors.cararra};
  border-radius: 50%;
  box-sizing: content-box;
  color: black;
  height: 18px;
  margin-right: 22px;
  overflow: hidden;
  padding: 7px;
  position: relative;
  width: 18px;

  img {
    left: 0;
    width: 100%;
    object-fit: cover;
    position: absolute;
    top: 0
  }
`

class GridCardIconWithName extends React.PureComponent {
  render() {
    const { icon, text } = this.props
    return (
      <Container>
        <IconHolder>
          { icon }
        </IconHolder>
        <Truncator
          text={text}
          key={text}
          extraSpacing={60}
          debug={true}
        />
      </Container>
    )
  }
}
GridCardIconWithName.propTypes = {
  text: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
}
export default GridCardIconWithName
