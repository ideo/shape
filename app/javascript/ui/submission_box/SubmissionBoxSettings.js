import _ from 'lodash'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import PropTypes from 'prop-types'
import { observable } from 'mobx'

import {
  Heading3,
  SmallHelperText,
  DisplayText,
} from '~/ui/global/styled/typography'
import { Checkbox } from '~/ui/global/styled/forms'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import { Row, RowItemLeft } from '~/ui/global/styled/layout'
import AlertIcon from '~/ui/icons/AlertIcon'
import AddTextIcon from '~/ui/icons/AddTextIcon'
import AddFileIcon from '~/ui/icons/AddFileIcon'
import AddLinkIcon from '~/ui/icons/AddLinkIcon'
import InlineLoader from '~/ui/layout/InlineLoader'
import v from '~/utils/variables'
import SubmissionBoxFormat from '~/ui/submission_box/SubmissionBoxFormat'

export const submissionItemTypes = [
  { name: 'text', Icon: AddTextIcon },
  { name: 'link', Icon: AddLinkIcon },
  { name: 'file', Icon: AddFileIcon },
]

export const submissionTypeForName = typeName =>
  _.find(submissionItemTypes, t => t.name === typeName)

@inject('apiStore')
@observer
class SubmissionBoxSettings extends React.Component {
  @observable
  loading = false
  @observable
  templates = []

  componentDidMount() {
    const { collection } = this.props
    const { apiStore, submission_template_id } = collection
    if (!submission_template_id) return
    apiStore.fetch('collections', submission_template_id)
  }

  updateHidden = ev => {
    ev.preventDefault()
    const { collection } = this.props
    collection.hide_submissions = !collection.hide_submissions
    return collection.save()
  }

  updateEnabled = ev => {
    ev.preventDefault()
    const { collection } = this.props
    collection.submissions_enabled = !collection.submissions_enabled
    return collection.save()
  }

  searchFilter = c => {
    const { submission_template_id } = this.props.collection
    return submission_template_id !== c.id
  }

  render() {
    const { collection, closeModal } = this.props
    const { submissions_enabled, hide_submissions } = collection
    return (
      <React.Fragment>
        {this.loading && <InlineLoader />}
        <Row>
          <span
            style={{
              display: 'inline-block',
              height: '25px',
              width: '25px',
              color: v.colors.commonMedium,
            }}
          >
            <AlertIcon />
          </span>
          <RowItemLeft>
            <SmallHelperText>
              Anyone invited to this collection will be able to add their
              version of the submission format selected below. Use one of our
              templates or create your own.
            </SmallHelperText>
            <FormControlLabel
              style={{ marginLeft: '-42px' }}
              classes={{ label: 'form-control' }}
              control={
                <Checkbox
                  checked={submissions_enabled}
                  onChange={this.updateEnabled}
                  value="yes"
                />
              }
              label={
                <div style={{ marginLeft: '-4px' }}>
                  <DisplayText>
                    Accept new submissions ({submissions_enabled ? 'ON' : 'OFF'}
                    )
                  </DisplayText>
                  <br />
                  <SmallHelperText>
                    When this box is checked, participants are able to create
                    new submissions and submit them.
                  </SmallHelperText>
                </div>
              }
            />
            <FormControlLabel
              style={{ marginLeft: '-42px' }}
              classes={{ label: 'form-control' }}
              control={
                <Checkbox
                  checked={hide_submissions}
                  onChange={this.updateHidden}
                  value="yes"
                />
              }
              label={
                <div style={{ marginLeft: '-4px' }}>
                  <DisplayText>Hide new submissions</DisplayText>
                  <br />
                  <SmallHelperText>
                    When this box is checked, submissions will not show up until
                    the participant chooses to submit it.
                  </SmallHelperText>
                </div>
              }
            />
          </RowItemLeft>
        </Row>
        <Heading3>Submission Format</Heading3>
        <SubmissionBoxFormat collection={collection} closeModal={closeModal} />
      </React.Fragment>
    )
  }
}

SubmissionBoxSettings.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  closeModal: PropTypes.func.isRequired,
}
SubmissionBoxSettings.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
SubmissionBoxSettings.displayName = 'SubmissionBoxSettings'

export default SubmissionBoxSettings
