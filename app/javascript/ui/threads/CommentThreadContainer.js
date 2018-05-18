import PropTypes from 'prop-types'
import { observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Element as ScrollElement, scroller } from 'react-scroll'
import styled from 'styled-components'

import CommentThread from './CommentThread'

const StyledCommentThreadContainer = styled.div`
  overflow-y: scroll;
  overflow-x: hidden;
  height: 100%;
`

@inject('apiStore', 'uiStore')
@observer
class CommentThreadContainer extends React.Component {
  // @observable threads = []
  @observable contentHeight = null
  scrollOpts = {
    containerId: 'ctc-content',
    delay: 50,
    duration: 350,
    smooth: true,
  }

  componentDidMount() {
    const { expandedThread } = this.props
    if (expandedThread) {
      const thread = this.threads.filter(t => t.id === expandedThread)[0]
      if (thread) {
        this.scrollToTopOfNextThread(thread)
      }
    }
  }

  // happens when log is already open and you toggle
  componentWillReceiveProps({ expandedThread }) {
    if (expandedThread) {
      const thread = this.threads.filter(t => t.id === expandedThread)[0]
      if (thread) {
        this.scrollToTopOfNextThread(thread)
      }
    }
  }

  get threads() {
    const { apiStore } = this.props
    return apiStore.currentThreads
  }

  contentHeight = () => (
    document.getElementById('ctc-content').clientHeight
  )

  toggleThreadExpanded = thread => () => {
    const { uiStore } = this.props
    const { id } = thread
    const expandedThread = uiStore.expandedThread === id ? null : id
    if (!expandedThread) {
      // when compacting, scroll back up to the top of this thread
      this.scrollToTopOfThread(thread)
    }
    uiStore.update('expandedThread', expandedThread)
  }

  scrollToTopOfThread = thread => {
    const idx = this.threads.indexOf(thread)
    scroller.scrollTo(`thread-${idx}`, {
      ...this.scrollOpts,
      delay: 0,
    })
  }

  scrollToTopOfNextThread = thread => {
    const idx = this.threads.indexOf(thread)
    const nextIdx = idx + 1

    // have to wait for this thread to expand so the next one is actually lower,
    // then we can scroll down to the top of the next thread.
    setTimeout(() => {
      scroller.scrollTo(`thread-${nextIdx}`, {
        ...this.scrollOpts,
        offset: -1 * this.contentHeight(),
      })
    }, 100)
  }

  afterSubmit = thread => () => {
    this.scrollToTopOfNextThread(thread)
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
          afterSubmit={this.afterSubmit(thread)}
        />
      </ScrollElement>
    ))
  )

  render() {
    return (
      <StyledCommentThreadContainer id="ctc-content">
        {this.renderThreads()}
        <ScrollElement
          name={`thread-${this.threads.length}`}
        />
      </StyledCommentThreadContainer>
    )
  }
}

CommentThreadContainer.propTypes = {
  expandedThread: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
}
CommentThreadContainer.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CommentThreadContainer.defaultProps = {
  expandedThread: null,
}

export default CommentThreadContainer
