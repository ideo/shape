import React from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import ModalWithNavigation from '~/ui/global/modals/ModalWithNavigation'
import SubmissionsSettings from '~/ui/challenges/SubmissionsSettings'
import PhaseSettings from '~/ui/challenges/PhaseSettings'

class ChallengeSettingsModal extends React.Component {
  get contents() {
    const { collection, onClose } = this.props
    return [
      {
        name: 'Submission settings',
        component: (
          <SubmissionsSettings collection={collection} closeModal={onClose} />
        ),
      },
      {
        name: 'Phases',
        component: (
          <PhaseSettings collection={collection} closeModal={onClose} />
        ),
      },
      { name: 'People', component: <div></div> },
      { name: 'Topics', component: <div></div> },
      { name: 'Styles', component: <div></div> },
    ]
  }

  render() {
    const { open, onClose } = this.props
    return (
      <ModalWithNavigation
        title="Challenge settings"
        contents={this.contents}
        open={open}
        onClose={onClose}
      />
    )
  }
}

ChallengeSettingsModal.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool,
}

ChallengeSettingsModal.defaultProps = {
  open: false,
}

export default ChallengeSettingsModal
