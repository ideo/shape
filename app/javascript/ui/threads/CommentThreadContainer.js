import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Element as ScrollElement, scroller } from 'react-scroll'
import _ from 'lodash'
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
  @observable threads = []
  @observable contentHeight = null
  scrollOpts = {
    containerId: 'ctc-content',
    delay: 75,
    duration: 400,
    smooth: true,
  }

  componentDidMount() {
    const { apiStore } = this.props
    apiStore.fetchAll('comment_threads').then((res) => {
      runInAction(() => {
        this.threads = _.sortBy(apiStore.findAll('comment_threads'), ['updated_at'])
      })
    })
  }

  contentHeight = () => (
    document.getElementById('ctc-content').clientHeight
  )

  toggleThreadExpanded = thread => () => {
    const { uiStore } = this.props
    const { id } = thread
    const expand = uiStore.expandedThread === id ? null : id
    const idx = this.threads.indexOf(thread)
    if (expand) {
      // if we're expanding, we scroll to the top of the next thread
      // (aka bottom of this thread)
      this.scrollToTopOfNextThread(thread)
    } else {
      // if we're compacting, we scroll to the top of this thread
      scroller.scrollTo(`thread-${idx}`, {
        ...this.scrollOpts,
        delay: 0,
      })
    }
    uiStore.update('expandedThread', expand)
  }

  scrollToTopOfNextThread = thread => {
    const { uiStore } = this.props
    const idx = this.threads.indexOf(thread)
    const nextIdx = idx + 1
    if (nextIdx === this.threads.length) {
      uiStore.scroll.scrollToBottom(this.scrollOpts)
    } else {
      // have to wait for this thread to expand so the next one is actually lower,
      // then we can scroll down to the top of the next thread.
      setTimeout(() => {
        scroller.scrollTo(`thread-${nextIdx}`, {
          ...this.scrollOpts,
          offset: -1 * this.contentHeight(),
        })
      }, 100)
    }
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
      </StyledCommentThreadContainer>
    )
  }
}

CommentThreadContainer.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CommentThreadContainer
