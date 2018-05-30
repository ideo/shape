import { observable, observe } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Element as ScrollElement, scroller } from 'react-scroll'
import styled from 'styled-components'

import CommentThread from './CommentThread'

const StyledCommentThreadContainer = styled.div`
  margin-top: -2px;
  overflow-y: scroll;
  overflow-x: hidden;
  height: 100%;
`

@inject('apiStore', 'uiStore')
@observer
class CommentThreadContainer extends React.Component {
  @observable contentHeight = null
  disposer = null
  scrollOpts = {
    containerId: 'ctc-content',
    delay: 0,
    duration: 350,
    smooth: true,
  }

  constructor(props) {
    super(props)
    this.disposer = observe(props.uiStore, 'expandedThreadKey', async (change) => {
      if (change.newValue) {
        this.handleExpandedThreadChange(change.newValue)
      }
    })
  }

  componentWillUnmount() {
    // cancel the observer
    this.disposer()
  }

  handleExpandedThreadChange = async (expandedThreadKey) => {
    const thread = this.threads.filter(t => t.key === expandedThreadKey)[0]
    if (!thread) return
    // don't try to load comments of our newly constructed threads
    if (thread.__persisted && thread.id) {
      await thread.API_fetchComments()
    }
    this.scrollToTopOfNextThread(thread)
  }

  get threads() {
    const { apiStore } = this.props
    return apiStore.currentThreads
  }

  contentHeight = () => (
    document.getElementById('ctc-content').clientHeight
  )

  expandThread = thread => () => {
    const { uiStore } = this.props
    const { key } = thread
    uiStore.expandThread(key)
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
    }, 50)
  }

  afterSubmit = thread => () => {
    this.scrollToTopOfNextThread(thread)
  }

  isExpanded = key => {
    const { uiStore } = this.props
    return uiStore.expandedThreadKey === key
  }

  renderThreads = () => (
    this.threads.map((thread, i) => (
      <ScrollElement name={`thread-${i}`} key={thread.key}>
        <CommentThread
          thread={thread}
          expanded={this.isExpanded(thread.key)}
          onClick={this.expandThread(thread)}
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

CommentThreadContainer.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CommentThreadContainer
