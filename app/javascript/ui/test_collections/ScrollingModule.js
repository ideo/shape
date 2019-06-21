import PropTypes from 'prop-types'
import FlipMove from 'react-flip-move'
import { Element as ScrollElement } from 'react-scroll'
import { Flex } from 'reflexbox'

const ScrollingModule = ({ name, children }) => {
  // ScrollElement only gets the right offsetTop if outside the FlipMove
  return (
    <ScrollElement name={name}>
      <FlipMove appearAnimation="fade">
        <div>
          <Flex style={{ width: 'auto', flexWrap: 'wrap' }}>{children}</Flex>
        </div>
      </FlipMove>
    </ScrollElement>
  )
}

ScrollingModule.propTypes = {
  children: PropTypes.func,
  name: PropTypes.string.isRequired,
}
ScrollingModule.defaultProps = {
  children: null,
}

export default ScrollingModule
