import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import ReactQuill from 'react-quill'
import styled from 'styled-components'

import ActionCableConsumer from '~/utils/ActionCableConsumer'
import InlineLoader from '~/ui/layout/InlineLoader'
import TextItem from '~/ui/items/TextItem'
import PaddedCardCover from './PaddedCardCover'
import { apiStore, routingStore, uiStore } from '~/stores'
import v from '~/utils/variables'

const StyledReadMore = styled.div`
  z-index: ${v.zIndex.gridCard};
  position: absolute;
  bottom: 0;
  left: 0;
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

@observer
class TextItemCover extends React.Component {
  state = {
    item: null,
    readMore: false,
    isEditing: false,
    loading: false,
  }

  componentDidMount() {
    const { height, item } = this.props
    this.checkTextAreaHeight(height)
    this.setState({ item })
  }

  componentWillReceiveProps({ height }) {
    this.checkTextAreaHeight(height)
  }

  handleEdit = (ev) => {
    // If already editing, pass event down
    if (uiStore.dragging) return
    if (this.state.isEditing) {
      ev.stopPropagation()
      return
    }
    ev.stopPropagation()
    this.setState({ isEditing: true })
  }

  expand = () => {
    const { item } = this.props
    routingStore.routeTo('items', item.id)
  }

  textChange = (itemTextData) => {
    const { item } = this.state
    item.text_data = itemTextData
    this.setState({ item })
  }

  blur = () => {
    this.setState({ isEditing: false })
    const node = ReactDOM.findDOMNode(this)
    console.log('node', node)
    node.scrollTop = 0
  }

  save = async (item, { cancel_sync = true } = {}) => {
    this.setState({ loading: true })
    await item.API_updateWithoutSync({ cancel_sync })
    this.setState({ isEditing: false, loading: false, item })
    const node = ReactDOM.findDOMNode(this);
    node.scrollTop = 0
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

  renderEditing() {
    const { item } = this.state
    return (
      <TextItem
        item={item}
        actionCableConsumer={ActionCableConsumer}
        currentUserId={apiStore.currentUser.id}
        onUpdatedData={this.textChange}
        onSave={this.save}
        onExpand={item.id ? this.expand : null}
        onCancel={this.blur}
      />
    )
  }

  renderDefault() {
    const { item } = this.props
    const textData = item.toJS().text_data
    const quillProps = {
      // ref is used to get the height of the div in checkTextAreaHeight
      ref: c => { this.quillEditor = c },
      readOnly: true,
      theme: null,
    }

    return (
      <ReactQuill
        {...quillProps}
        value={textData}
      />
    )
  }

  render() {
    const { isEditing } = this.state
    const content = isEditing
      ? this.renderEditing()
      : this.renderDefault()
    return (
      <PaddedCardCover
        style={{ height: 'calc(100% - 30px)', overflow: isEditing ? 'scroll' : 'hidden' }}
        class="cancelGridClick"
        onClick={this.handleEdit}
      >
        { this.state.loading && <InlineLoader /> }
        {content}
        { (this.state.readMore && !isEditing) && <StyledReadMore onClick={this.expand}>read more...</StyledReadMore> }
      </PaddedCardCover>
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
