import PropTypes from 'prop-types'
import { Flex } from 'reflexbox'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'

import { Checkbox } from '~/ui/global/styled/forms'
import EntityAvatarAndName from '~/ui/global/EntityAvatarAndName'
import InlineModal from '~/ui/global/modals/InlineModal'

@observer
class AddReviewersPopover extends React.Component {
  isReviewerSelected(potentialReviewer) {
    const { record } = this.props
    const { currentReviewerHandles } = record
    if (_.isEmpty(currentReviewerHandles)) return false
    return (
      currentReviewerHandles.findIndex(
        handle => handle === _.get(potentialReviewer, 'handle')
      ) > -1
    )
  }

  handleClick = ev => {
    ev.preventDefault()
    ev.stopPropagation()
    return false
  }

  handlePotentialReviewer = (reviewer, ev) => {
    ev.preventDefault()
    ev.stopPropagation()
    const { record } = this.props
    if (!reviewer) return
    const { handle } = reviewer
    if (!handle) return
    const action = this.isReviewerSelected(reviewer) ? 'removeTag' : 'addTag'
    record[action](handle, 'user_tag_list', reviewer)
  }

  get currentReviewers() {
    const { record } = this.props
    if (!record.user_tag_list) return []
    return record.user_tag_list
  }

  render() {
    const { onClose, open, wrapperRef, potentialReviewers } = this.props
    return (
      <InlineModal
        title=""
        onCancel={onClose}
        open={open}
        anchorElement={wrapperRef.current}
        anchorOrigin={{ horizontal: 'left', vertical: 'center' }}
        noButtons
      >
        <div onClick={this.handleClick}>
          {potentialReviewers.map(potentialReviewer => (
            <Flex>
              <Checkbox
                color="primary"
                checked={this.isReviewerSelected(potentialReviewer)}
                onClick={ev =>
                  this.handlePotentialReviewer(potentialReviewer, ev)
                }
                value="yes"
                key={potentialReviewer.handle}
              />
              <EntityAvatarAndName entity={potentialReviewer} />
            </Flex>
          ))}
        </div>
      </InlineModal>
    )
  }
}

AddReviewersPopover.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  onClose: PropTypes.func.isRequired,
  wrapperRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  open: PropTypes.bool,
  potentialReviewers: PropTypes.array.isRequired,
}

AddReviewersPopover.defaultProps = {
  open: false,
}

export default AddReviewersPopover
