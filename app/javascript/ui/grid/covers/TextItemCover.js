import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import ReactQuill from 'react-quill'
import styled from 'styled-components'

import v from '~/utils/variables'
import PaddedCardCover from './PaddedCardCover'

const StyledReadMore = styled.div`
  z-index: ${v.zIndex.gridCard};
  position: absolute;
  bottom: 0;
  width: 100%;
  text-align: center;
  padding: 0.5rem;
  opacity: 0.95;
  background: white;
  font-size: 0.9rem;

  &:hover {
    background: ${v.colors.desert};
  }
`
StyledReadMore.displayName = 'StyledReadMore'

class TextItemCover extends React.Component {
  state = {
    readMore: false
  }

  componentDidMount() {
    const { height } = this.props
    this.checkTextAreaHeight(height)
  }

  componentWillReceiveProps({ height }) {
    this.checkTextAreaHeight(height)
  }

  checkTextAreaHeight = (height) => {
    if (!this.quillEditor) return
    const textAreaHeight = this.quillEditor.getEditingArea().offsetHeight
    // render the Read More link if the text height exceeds viewable area
    if (height && textAreaHeight > height) {
      this.setState({ readMore: true })
    } else {
      this.setState({ readMore: false })
    }
  }

  render() {
    const { item } = this.props
    // we have to convert the item to a normal JS object for Quill to be happy
    const textData = item.toJS().text_data
    const quillProps = {
      // ref is used to get the height of the div in checkTextAreaHeight
      ref: c => { this.quillEditor = c },
      readOnly: true,
      theme: null,
    }

    return (
      <div>
        <PaddedCardCover>
          <ReactQuill
            {...quillProps}
            value={textData}
          />
        </PaddedCardCover>
        {/* readMore is a sibling to the cover itself */}
        { this.state.readMore && <StyledReadMore>read more...</StyledReadMore> }
      </div>
    )
  }
}

TextItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  height: PropTypes.number,
}

TextItemCover.defaultProps = {
  height: null,
}

export default TextItemCover
