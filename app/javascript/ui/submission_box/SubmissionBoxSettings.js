import _ from 'lodash'
import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import {
  Heading3,
  SmallHelperText,
  DisplayText,
} from '~/ui/global/styled/typography'
import { Checkbox } from '~/ui/global/styled/forms'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import { Row, RowItemLeft } from '~/ui/global/styled/layout'
import InfoIcon from '~/ui/icons/InfoIcon'
import AddTextIcon from '~/ui/icons/AddTextIcon'
import AddFileIcon from '~/ui/icons/AddFileIcon'
import AddLinkIcon from '~/ui/icons/AddLinkIcon'
import v from '~/utils/variables'
import SubmissionBoxFormat from '~/ui/submission_box/SubmissionBoxFormat'
import AudienceSettings from '~/ui/test_collections/AudienceSettings'

const InfoIconWrapper = styled.span`
  display: inline-block;
  margin-top: 4px;
  width: 16px;
  height: 16px;
  color: ${v.colors.commonMedium};
  > .icon {
    width: 16px;
  }
`

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
  submissionTemplateTest = null

  componentDidMount() {
    const { collection } = this.props

    const { submission_template } = collection

    if (submission_template) {
      const { submission_template_test_collections } = submission_template

      if (!_.isEmpty(submission_template_test_collections)) {
        // FIXME: use the first test for now
        runInAction(() => {
          const submissionTemplateTest = submission_template_test_collections[0]
          this.submissionTemplateTest = submissionTemplateTest
        })
      }
    }
  }

  toggleHidden = ev => {
    ev.preventDefault()
    const { collection } = this.props
    collection.hide_submissions = !collection.hide_submissions
    return collection.save()
  }

  toggleEnabled = ev => {
    ev.preventDefault()
    const { collection } = this.props
    collection.submissions_enabled = !collection.submissions_enabled
    return collection.save()
  }

  render() {
    const { collection, closeModal } = this.props
    const { submissions_enabled, hide_submissions } = collection
    return (
      <React.Fragment>
        <Row>
          <InfoIconWrapper>
            <InfoIcon />
          </InfoIconWrapper>
          <RowItemLeft>
            <SmallHelperText>
              Anyone invited to this collection will be able to add their
              version of the submission format selected below. Use one of our
              templates or create your own.
            </SmallHelperText>
            <FormControlLabel
              style={{ marginLeft: '-42px' }}
              classes={{ label: 'form-control' }}
              data-cy="SubmissionSettings-AcceptNew"
              control={
                <Checkbox
                  checked={submissions_enabled}
                  onChange={this.toggleEnabled}
                  value="yes"
                />
              }
              label={
                <div style={{ marginLeft: '-4px' }}>
                  <DisplayText data-cy="SubmissionSettings-AcceptNewText">
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
              data-cy="SubmissionSettings-HideNew"
              control={
                <Checkbox
                  checked={hide_submissions}
                  onChange={this.toggleHidden}
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
        {this.submissionTemplateTest && (
          <AudienceSettings
            testCollection={this.submissionTemplateTest}
            submissionBox={collection}
          />
        )}
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
