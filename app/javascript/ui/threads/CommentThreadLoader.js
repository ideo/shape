import { observable, action } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
// import styled from 'styled-components'

import { TextButton } from '~/ui/global/styled/forms'
import InlineLoader from '~/ui/layout/InlineLoader'
import RefreshIcon from '~/ui/icons/RefreshIcon'
import v from '~/utils/variables'

const StyledCommentThreadLoader = TextButton.extend`
  height: 80px;
  position: relative;
  margin-bottom: 5px;
  background: ${props =>
    props.disabled ? v.colors.cloudy : v.colors.activityMedBlue};
  width: 100%;

  .refreshIcon {
    display: inline-block;
    height: 15px;
    width: 35px;
  }

  .text {
    margin-top: 25px;
  }
`

@observer
class CommentThreadLoader extends React.Component {
  @observable
  loading = false

  @action
  setLoading = val => {
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
        {this.loading && <InlineLoader fixed background="none" />}
        <StyledCommentThreadLoader
          disabled={this.loading}
          onClick={this.loadMore}
        >
          <div className="text">
            <span className="refreshIcon">
              <RefreshIcon />
            </span>
            <span>Show more</span>
          </div>
        </StyledCommentThreadLoader>
      </div>
    )
  }
}

CommentThreadLoader.propTypes = {
  thread: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CommentThreadLoader
