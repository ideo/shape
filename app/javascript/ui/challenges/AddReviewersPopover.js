import PropTypes from 'prop-types'
import { Flex } from 'reflexbox'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { Checkbox } from '~/ui/global/styled/forms'
import EntityAvatarAndName from '~/ui/global/EntityAvatarAndName'
import InlineModal from '~/ui/global/modals/InlineModal'
import { apiStore } from '~/stores'

@observer
class AddReviewersPopover extends React.Component {
  componedDidMount() {
    const { record } = this.props
    record.fetchChallengeReviewers()
  }

  isReviewerSelected(potentialReviewer) {
    const { currentReviewers } = this
    return !!currentReviewers.find(
      reviewer => reviewer.id === potentialReviewer.id
    )
  }

  handlePotentialReviewer = reviewer => {
    const { record } = this.props
    const action = this.isReviewerSelected(reviewer) ? 'remove' : 'add'
    apiStore.request(`collection_cards/${action}_tag`, 'PATCH', {
      card_ids: [record.parent.id],
      tag: reviewer.handle,
      type: 'users',
    })
  }

  get potentialReviewers() {
    const { record } = this.props
    return record.challengeReviewers || []
  }

  get currentReviewers() {
    const { record } = this.props
    return record.user_list || []
  }

  render() {
    const { onClose, open, wrapperRef } = this.props
    return (
      <InlineModal
        title=""
        onCancel={onClose}
        open={open}
        anchorElement={wrapperRef}
        anchorOrigin={{ horizontal: 'left', vertical: 'center' }}
        noButtons
      >
        {this.potentialReviewers.map(potentialReviewer => (
          <Flex>
            <Checkbox
              color="primary"
              checked={this.isReviewerSelected(potentialReviewer)}
              onChange={ev => this.handlePotentialReviewer(potentialReviewer)}
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
