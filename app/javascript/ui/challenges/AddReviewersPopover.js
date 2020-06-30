import PropTypes from 'prop-types'
import { Flex } from 'reflexbox'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { Checkbox } from '~/ui/global/styled/forms'
import EntityAvatarAndName from '~/ui/global/EntityAvatarAndName'
import InlineModal from '~/ui/global/modals/InlineModal'

@observer
class AddReviewersPopover extends React.Component {
  componentDidMount() {
    const { record } = this.props
    record.fetchChallengeReviewersGroup()
  }

  isReviewerSelected(potentialReviewer) {
    const { currentReviewers } = this
    return !!currentReviewers.find(
      reviewer => reviewer.id === potentialReviewer.id
    )
  }

  handlePotentialReviewer = (reviewer, ev) => {
    const { record } = this.props
    ev.preventDefault()
    ev.stopPropagation()
    const action = this.isReviewerSelected(reviewer) ? 'removeTag' : 'addTag'
    console.log('handle reviewr', action, record.parentChallenge)
    record[action](reviewer.handle, 'user_tag_list', reviewer)
    return false
  }

  get potentialReviewers() {
    const { record } = this.props
    if (!record.challengeReviewerGroup) return []
    const members = record.challengeReviewerGroup.roles.find(
      r => r.label === 'member'
    ).users
    return members
  }

  get currentReviewers() {
    const { record } = this.props
    if (!record.user_tag_list) return []
    return record.user_tag_list.map(t => t.user)
  }

  render() {
    const { onClose, open, wrapperRef } = this.props
    console.log('render', [...this.currentReviewers])
    return (
      <InlineModal
        title=""
        onCancel={onClose}
        open={open}
        anchorElement={wrapperRef.current}
        anchorOrigin={{ horizontal: 'left', vertical: 'center' }}
        noButtons
      >
        {this.potentialReviewers.map(potentialReviewer => (
          <Flex>
            <Checkbox
              color="primary"
              checked={this.isReviewerSelected(potentialReviewer)}
              onChange={ev =>
                this.handlePotentialReviewer(potentialReviewer, ev)
              }
              value="yes"
            />
            <EntityAvatarAndName entity={potentialReviewer} />
          </Flex>
        ))}
      </InlineModal>
    )
  }
}

AddReviewersPopover.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  onClose: PropTypes.func.isRequired,
  wrapperRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  open: PropTypes.bool,
}

AddReviewersPopover.defaultProps = {
  open: false,
}

export default AddReviewersPopover
