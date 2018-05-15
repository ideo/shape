import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Dialog, { DialogContent } from 'material-ui/Dialog'
import { Element as ScrollElement, scroller } from 'react-scroll'
import _ from 'lodash'

import { ModalCloseButton } from '~/ui/global/modals/Modal'
import CommentThread from './CommentThread'

@inject('apiStore', 'uiStore')
@observer
class CommentThreadContainer extends React.Component {
  @observable threads = []
  @observable contentHeight = null

  componentDidMount() {
    const { apiStore } = this.props
    apiStore.fetchAll('comment_threads').then((res) => {
      runInAction(() => {
        this.threads = _.sortBy(apiStore.findAll('comment_threads'), ['updated_at'])
      })
    })
  }

  get isOpen() {
    const { uiStore } = this.props
    return uiStore.commentsOpen
  }

  contentHeight = () => (
    document.getElementById('ctc-content').clientHeight
  )

  handleClose = () => {
    const { uiStore } = this.props
    uiStore.update('commentsOpen', false)
  }

  toggleThreadExpanded = thread => () => {
    const { uiStore } = this.props
    const { id } = thread
    const val = uiStore.expandedThread === id ? null : id
    if (val) {
      const nextIdx = this.threads.indexOf(thread) + 1
      const scrollOpts = {
        containerId: 'ctc-content',
        delay: 75,
        duration: 400,
        smooth: true,
      }
      if (nextIdx === this.threads.length) {
        uiStore.scroll.scrollToBottom(scrollOpts)
      } else {
        setTimeout(() => {
          scroller.scrollTo(`thread-${nextIdx}`, {
            ...scrollOpts,
            // HACK: should actually calculate content height I guess
            offset: -1 * this.contentHeight(),
          })
        }, 100)
      }
    }
    uiStore.update('expandedThread', val)
  }

  isExpanded = id => {
    const { uiStore } = this.props
    return uiStore.expandedThread === id
  }

  renderThreads = () => (
    this.threads.map((thread, i) => (
      <ScrollElement name={`thread-${i}`} key={thread.id}>
        <CommentThread
          thread={thread}
          expanded={this.isExpanded(thread.id)}
          onClick={this.toggleThreadExpanded(thread)}
        />
      </ScrollElement>
    ))
  )

  render() {
    return (
      <Dialog
        open={this.isOpen}
        onClose={this.handleClose}
        onBackdropClick={this.handleClose}
        BackdropProps={{ invisible: true }}
      >
        <ModalCloseButton onClick={this.handleClose}>
          x
        </ModalCloseButton>
        <DialogContent id="ctc-content" style={{ margin: '25px 0' }}>
          { this.renderThreads() }
        </DialogContent>
      </Dialog>
    )
  }
}

CommentThreadContainer.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CommentThreadContainer
