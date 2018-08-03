import { observable, action } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import InlineLoader from '~/ui/layout/InlineLoader'

@observer
class CommentThreadLoader extends React.Component {
  @observable loading = false

  @action setLoading = val => {
    this.loading = val
  }

  loadMore = async () => {
    const { thread } = this.props
    this.setLoading(true)
    await thread.API_fetchComments({ next: true })
    this.setLoading(false)
  }

  render() {
    return (
      <div>
        { this.loading && <InlineLoader fixed background="none" /> }
        <button onClick={this.loadMore} style={{ background: 'blue', padding: '20px' }}>
          Click me for more
        </button>
      </div>
    )
  }
}

CommentThreadLoader.propTypes = {
  thread: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CommentThreadLoader
