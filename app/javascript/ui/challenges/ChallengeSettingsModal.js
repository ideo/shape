import React from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import ModalWithNavigation from '~/ui/global/modals/ModalWithNavigation'
import SubmissionsSettings from '~/ui/challenges/SubmissionsSettings'

class ChallengeSettingsModal extends React.Component {
  get contents() {
    const { collection } = this.props
    return [
      {
        name: 'Submission settings',
        component: <SubmissionsSettings collection={collection} />,
      },
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
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  open: PropTypes.bool,
}

ChallengeSettingsModal.defaultProps = {
  open: false,
}

export default ChallengeSettingsModal
