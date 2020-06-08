import _ from 'lodash'
import pluralize from 'pluralize'
import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, runInAction } from 'mobx'
import { Box } from 'reflexbox'
import InlineLoader from '~/ui/layout/InlineLoader'

import RecordSearch from '~/ui/global/RecordSearch'
import {
  SubmissionBoxRowForItem,
  SubmissionBoxRowForTemplate,
} from '~/ui/submission_box/SubmissionBoxRow'
import { submissionItemTypes } from '~/ui/submission_box/SubmissionBoxSettings'

@inject('apiStore', 'uiStore')
@observer
class EditSubmissionBoxFormat extends React.Component {
  @observable
  loading = false
  @observable
  templates = []

  get locked() {
    const { uiStore } = this.props
    // if the modal is open via CollectionPage and not from uiStore, that means
    // settings are required and the modal is locked open (cannot close)
    return !uiStore.submissionBoxSettingsOpen
  }

  confirmSubmissionTemplateChange = ({ type, template } = {}, callback) => {
    const { uiStore, collection } = this.props
    if (!collection.countSubmissions) callback()

    uiStore.confirm({
      iconName: 'Alert',
      prompt: `Are you sure?
              There are already ${collection.countSubmissions} submissions.
              New submissions will be
              ${
                template ? pluralize(template.name) : pluralize(`${type} item`)
              }.`,
      confirmText: 'Continue',
      cancelText: 'Cancel',
      onConfirm: () => callback(),
      onCancel: () => uiStore.closeDialog(),
    })
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
    const { collection, uiStore, apiStore, onDone } = this.props
    const templateCardId = template ? template.parent_collection_card.id : null
    const submission_box_type = template ? 'template' : type
    const data = {
      box_id: collection.id,
      template_card_id: templateCardId,
      submission_box_type,
    }
    try {
      await collection.API_setSubmissionBoxTemplate(data)
      onDone()
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

  chooseTemplate = template => {
    this.confirmSubmissionTemplateChange({ template }, () => {
      this.setTemplate({ template })
    })
  }

  chooseNonTemplateType = type => {
    this.confirmSubmissionTemplateChange({ type }, () => {
      this.props.collection.submission_template = null
      this.setTemplate({ type })
    })
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
      <div>
        <RecordSearch
          onSelect={() => {}}
          onSearch={this.onSearch}
          initialLoadAmount={25}
          searchFilter={this.searchFilter}
          searchParams={{ master_template: true }}
        />
        <Box mt={2} mb={2}>
          {this.loading && <InlineLoader />}
          {this.nonSelectedSubmissionTypes.map(type => (
            <SubmissionBoxRowForItem
              type={type}
              onSelect={this.chooseNonTemplateType}
              key={type.name}
            />
          ))}
          {this.templates.map(template => (
            <SubmissionBoxRowForTemplate
              template={template}
              onSelect={this.chooseTemplate}
              key={template.id}
            />
          ))}
        </Box>
      </div>
    )
  }
}

EditSubmissionBoxFormat.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  onDone: PropTypes.func.isRequired,
}
EditSubmissionBoxFormat.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
EditSubmissionBoxFormat.displayName = 'EditSubmissionBoxFormat'

export default EditSubmissionBoxFormat
