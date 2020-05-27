import _ from 'lodash'
import pluralize from 'pluralize'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { computed, observable, runInAction } from 'mobx'
import styled from 'styled-components'

import Modal from '~/ui/global/modals/Modal'
import {
  Heading2,
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
import Modal from '~/ui/global/modals/Modal'
import RecordSearch from '~/ui/global/RecordSearch'
import v from '~/utils/variables'
import {
  SubmissionBoxRowForItem,
  SubmissionBoxRowForTemplate,
} from '~/ui/submission_box/SubmissionBoxRow'

const StyledTitleContent = styled.div`
  border-bottom: 1px solid ${v.colors.commonMedium};
`

export const submissionItemTypes = [
  { name: 'text', Icon: AddTextIcon },
  { name: 'link', Icon: AddLinkIcon },
  { name: 'file', Icon: AddFileIcon },
]

export const submissionTypeForName = typeName =>
  _.find(submissionItemTypes, t => t.name === typeName)

@inject('apiStore', 'uiStore', 'routingStore')
@observer
class EditSubmissionBoxFormatModal extends React.Component {
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

  get locked() {
    const { uiStore } = this.props
    // if the modal is open via CollectionPage and not from uiStore, that means
    // settings are required and the modal is locked open (cannot close)
    return !uiStore.submissionBoxSettingsOpen
  }

  handleClose = ev => {
    const { apiStore, uiStore, routingStore, collection } = this.props
    if (!this.locked) {
      uiStore.update('submissionBoxSettingsOpen', false)
      return
    }
    // Note that the meaning of "cancel" and "confirm" are sort of reversed in this context.
    // "cancel" means cancel creating the SubmissionBox, which will delete it and go back.
    // "confirm" means do nothing so that you can continue with setup.
    uiStore.confirm({
      iconName: 'Alert',
      prompt: `Closing the submission settings without choosing a submission format
               will delete this submission box.`,
      confirmText: 'Choose',
      cancelText: 'Delete',
      onCancel: async () => {
        await apiStore.request(`collections/${collection.id}`, 'DELETE')
        if (collection.parent_collection_card.parent_id) {
          routingStore.routeTo(
            'collections',
            collection.parent_collection_card.parent_id
          )
        } else {
          routingStore.routeTo('homepage')
        }
      },
      onConfirm: () => uiStore.closeDialog(),
    })
  }

  confirmSubmissionTemplateChange = ({ type, template } = {}, callback) => {
    const { uiStore, collection } = this.props
    if (collection.countSubmissions) {
      uiStore.confirm({
        iconName: 'Alert',
        prompt: `Are you sure?
                There are already ${collection.countSubmissions} submissions.
                New submissions will be
                ${
                  template
                    ? pluralize(template.name)
                    : pluralize(`${type} item`)
                }.`,
        confirmText: 'Continue',
        cancelText: 'Cancel',
        onConfirm: () => callback(),
        onCancel: () => uiStore.closeDialog(),
      })
      return
    }
    // otherwise just go straight to the callback if no submissions
    callback()
  }

  onSearch = templates => {
    if (!templates) return
    runInAction(() => {
      this.templates = templates
    })
  }

  // you can either set it to be a template, or a type like "text"
  async setTemplate({ template = null, type = '' } = {}) {
    runInAction(() => {
      this.loading = true
    })
    const { collection, uiStore, apiStore } = this.props
    const templateCardId = template ? template.parent_collection_card.id : null
    const submission_box_type = template ? 'template' : type
    const data = {
      box_id: collection.id,
      template_card_id: templateCardId,
      submission_box_type,
    }
    try {
      await collection.API_setSubmissionBoxTemplate(data)
      uiStore.update('submissionBoxSettingsOpen', false)
      if (collection.submissions_collection) {
        // Re-fetch submissions collection as submissions names change
        await apiStore.fetch(
          'collections',
          collection.submissions_collection.id,
          true
        )
        // this will update the CollectionPage
        uiStore.update('loadedSubmissions', true)
      }
    } catch (e) {
      uiStore.alert('Unable to use that template')
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  chooseTemplate = template => () => {
    this.confirmSubmissionTemplateChange({ template }, () => {
      this.setTemplate({ template })
    })
  }

  chooseNonTemplateType = type => () => {
    this.confirmSubmissionTemplateChange({ type }, () => {
      this.props.collection.submission_template = null
      this.setTemplate({ type })
    })
  }

  // computed to allow it to observe changing submission_template_id
  @computed
  get selectedOption() {
    const {
      submission_template_id,
      submission_box_type,
    } = this.props.collection
    const { apiStore } = this.props
    let template
    if (submission_template_id) {
      template = apiStore.find('collections', submission_template_id)
    }
    if (template) {
      return (
        <SubmissionBoxRowForTemplate
          template={template}
          onChooseTemplate={this.chooseTemplate}
        />
      )
    } else if (submission_box_type && submission_box_type !== 'template') {
      const type = submissionTypeForName(submission_box_type)
      return (
        <SubmissionBoxRowForItem
          type={type}
          onChooseType={this.chooseNonTemplateType}
        />
      )
    }
    return ''
  }

  searchFilter = collection => {
    const { submission_template_id } = this.props.collection
    return submission_template_id !== collection.id
  }

  get nonSelectedSubmissionTypes() {
    const { submission_box_type } = this.props.collection
    // Exclude selected type
    return _.filter(
      submissionItemTypes,
      type => type.name !== submission_box_type
    )
  }

  render() {
    return (
      <Modal title={<Heading2>Edit Submission Box Format</Heading2>}>
        <RecordSearch
          onSelect={() => {}}
          onSearch={this.onSearch}
          initialLoadAmount={25}
          searchFilter={this.searchFilter}
          searchParams={{ master_template: true }}
        />
        {this.nonSelectedSubmissionTypes.map(type => (
          <SubmissionBoxRowForItem type={type} />
        ))}
      </Modal>
    )
  }
}

EditSubmissionBoxFormatModal.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}
EditSubmissionBoxFormatModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default EditSubmissionBoxFormatModal
