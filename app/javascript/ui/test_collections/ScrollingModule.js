import FlipMove from 'react-flip-move'
import { Element as ScrollElement, scroller } from 'react-scroll'
import { Flex } from 'reflexbox'
import { PropTypes } from 'mobx-react'

const ScrollingModule = ({ children }) => {
  // ScrollElement only gets the right offsetTop if outside the FlipMove
  return (
    <ScrollElement>
      <FlipMove appearAnimation="fade">
        <div>
          <Flex
            style={{
              width: 'auto',
              flexWrap: 'wrap',
            }}
          >
            {children}
          </Flex>
        </div>
      </FlipMove>
    </ScrollElement>
  )
}

ScrollingModule.propTypes = {
  children: PropTypes.func,
}
ScrollingModule.defaultProps = {
  children: null,
}

export default ScrollingModule
