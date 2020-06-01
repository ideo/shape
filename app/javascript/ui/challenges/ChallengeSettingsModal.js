import React from 'react'
import PropTypes from 'prop-types'

import ModalWithNavigation from '~/ui/global/modals/ModalWithNavigation'

class ChallengeSettingsModal extends React.Component {
  get contents() {
    return [
      { name: 'Submission settings', component: <div></div> },
      { name: 'Phases', component: <div></div> },
      { name: 'People', component: <div></div> },
      { name: 'Topics', component: <div></div> },
      { name: 'Styles', component: <div></div> },
    ]
  }

  render() {
    const { open } = this.props
    return (
      <ModalWithNavigation
        title="Challenge settings"
        contents={this.contents}
        open={open}
      />
    )
  }
}
ChallengeSettingsModal.propTypes = {
  open: PropTypes.bool,
}

export default ChallengeSettingsModal
