import PropTypes from 'prop-types'
import { Flex } from 'reflexbox'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'

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
      reviewer => reviewer === potentialReviewer.handle
    )
  }

  handleClick = ev => {
    ev.preventDefault()
    ev.stopPropagation()
    return false
  }

  handlePotentialReviewer = (reviewer, ev) => {
    const { record } = this.props
    ev.preventDefault()
    ev.stopPropagation()
    const action = this.isReviewerSelected(reviewer) ? 'removeTag' : 'addTag'
    record[action](reviewer.handle, 'user_tag_list', reviewer)
  }

  get potentialReviewers() {
    const { record } = this.props
    const challengeRoles = _.get(record, 'challengeReviewerGroup.roles')
    if (_.isEmpty(challengeRoles)) return []
    const memberRole = challengeRoles.find(r => r.label === 'member')
    return _.get(memberRole, 'users', [])
  }

  get currentReviewers() {
    const { record } = this.props
    if (!record.user_tag_list) return []
    return record.user_tag_list
  }

  render() {
    const { onClose, open, wrapperRef } = this.props
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
}

AddReviewersPopover.defaultProps = {
  open: false,
}

export default AddReviewersPopover
