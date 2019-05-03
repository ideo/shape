import _ from 'lodash'
import pluralize from 'pluralize'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, runInAction } from 'mobx'
import styled from 'styled-components'

import {
  Heading2,
  Heading3,
  SmallHelperText,
  DisplayText,
} from '~/ui/global/styled/typography'
import { Checkbox } from '~/ui/global/styled/forms'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import { Row, RowItemLeft } from '~/ui/global/styled/layout'
import { ThumbnailHolder } from '~/ui/threads/CommentThread'
import { BctButton } from '~/ui/grid/shared'
import AlertIcon from '~/ui/icons/AlertIcon'
import AddTextIcon from '~/ui/icons/AddTextIcon'
import AddFileIcon from '~/ui/icons/AddFileIcon'
import AddLinkIcon from '~/ui/icons/AddLinkIcon'
import InlineLoader from '~/ui/layout/InlineLoader'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import Modal from '~/ui/global/modals/Modal'
import RecordSearch from '~/ui/global/RecordSearch'
import v from '~/utils/variables'

const SubmissionBoxRow = Row.extend`
  cursor: pointer;
  font-family: ${v.fonts.sans};
  transition: background-color 0.3s;
  padding: 0.5rem 0;
  &:hover {
    background: ${v.colors.commonLightest};
  }
  &.selected {
    background: ${v.colors.primaryLight};
  }
`
const SubmissionBoxRowText = RowItemLeft.extend`
  padding-top: 0.75rem;
`

const StyledTitleContent = styled.div`
  border-bottom: 1px solid ${v.colors.commonMedium};
`

@inject('apiStore', 'uiStore', 'routingStore')
@observer
class SubmissionBoxSettingsModal extends React.Component {
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

  get submissions() {
    const { collection } = this.props
    return collection.submissions_collection.collection_cards.map(
      card => card.record
    )
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

  submissionBoxRowForItem = typeName => {
    const types = [
      { name: 'text', Icon: AddTextIcon },
      { name: 'link', Icon: AddLinkIcon },
      { name: 'file', Icon: AddFileIcon },
    ]
    const type = _.find(types, t => t.name === typeName)
    return (
      <SubmissionBoxRow
        key={type.name}
        noSpacing
        onClick={this.chooseNonTemplateType(type.name)}
      >
        <BctButton>
          <type.Icon />
        </BctButton>
        <SubmissionBoxRowText>
          {_.startCase(type.name)} Item
        </SubmissionBoxRowText>
      </SubmissionBoxRow>
    )
  }

  submissionBoxRowForTemplate = template => (
    <SubmissionBoxRow
      key={template.id}
      noSpacing
      onClick={this.chooseTemplate(template)}
    >
      <ThumbnailHolder>
        {template.cover.image_url && (
          <img src={template.cover.image_url} alt={template.name} />
        )}
        {!template.cover.image_url && <TemplateIcon circled filled />}
      </ThumbnailHolder>
      <SubmissionBoxRowText>{template.name}</SubmissionBoxRowText>
    </SubmissionBoxRow>
  )

  selectedOption = () => {
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
      return this.submissionBoxRowForTemplate(template)
    } else if (submission_box_type && submission_box_type !== 'template') {
      return this.submissionBoxRowForItem(submission_box_type)
    }
    return ''
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

  titleContent = () => {
    const { collection } = this.props
    const { submissions_enabled, hide_submissions } = collection

    return (
      <StyledTitleContent>
        <Heading2>Submission Box Settings</Heading2>
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
              Anyone invited to this collection box will be able to instantly
              create their own instance of the template that you choose. Use one
              of our templates or create your own.
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
        {this.selectedOption()}
      </StyledTitleContent>
    )
  }

  get itemRows() {
    const { submission_box_type } = this.props.collection
    const types = ['text', 'link', 'file']
    return _.filter(types, t => t !== submission_box_type).map(type =>
      this.submissionBoxRowForItem(type)
    )
  }

  searchFilter = c => {
    const { submission_template_id } = this.props.collection
    return submission_template_id !== c.id
  }

  render() {
    return (
      <Modal
        title={this.titleContent()}
        onClose={this.handleClose}
        disableBackdropClick={this.locked}
        open
      >
        <div>
          <RecordSearch
            onSelect={() => {}}
            onSearch={this.onSearch}
            initialLoadAmount={25}
            searchFilter={this.searchFilter}
            searchTags={['template']}
          />
          <br />
          {this.itemRows}
          {this.templates.map(template =>
            this.submissionBoxRowForTemplate(template)
          )}
        </div>
      </Modal>
    )
  }
}

SubmissionBoxSettingsModal.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}
SubmissionBoxSettingsModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default SubmissionBoxSettingsModal
