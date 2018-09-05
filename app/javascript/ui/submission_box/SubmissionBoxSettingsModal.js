import _ from 'lodash'
import pluralize from 'pluralize'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import {
  Heading2,
  Heading3,
  SmallHelperText,
} from '~/ui/global/styled/typography'
import {
  Row,
  RowItemLeft,
} from '~/ui/global/styled/layout'
import {
  ThumbnailHolder
} from '~/ui/threads/CommentThread'
import { BctButton } from '~/ui/grid/shared'
import AlertIcon from '~/ui/icons/AlertIcon'
import AddTextIcon from '~/ui/icons/AddTextIcon'
import AddFileIcon from '~/ui/icons/AddFileIcon'
import AddLinkIcon from '~/ui/icons/AddLinkIcon'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import Modal from '~/ui/global/modals/Modal'
import v from '~/utils/variables'

const SubmissionBoxRow = Row.extend`
  cursor: pointer;
  font-family: ${v.fonts.sans};
  transition: background-color 0.3s;
  padding: 0.5rem 0;
  &:hover {
    background: ${v.colors.desert};
  }
  &.selected {
    background: ${v.colors.cyan};
  }
`
const SubmissionBoxRowText = RowItemLeft.extend`
  padding-top: 0.75rem;
`

const StyledTitleContent = styled.div`
  border-bottom: 1px solid ${v.colors.gray};
`

@inject('apiStore', 'uiStore', 'routingStore')
@observer
class SubmissionBoxSettingsModal extends React.Component {
  componentDidMount() {
    const { apiStore } = this.props
    apiStore.fetchUsableTemplates()
  }

  get templates() {
    return this.props.apiStore.usableTemplates
  }

  get locked() {
    const { uiStore } = this.props
    // if the modal is open via CollectionPage and not from uiStore, that means
    // settings are required and the modal is locked open (cannot close)
    return !uiStore.submissionBoxSettingsOpen
  }

  handleClose = (ev) => {
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
          routingStore.routeTo('collections',
            collection.parent_collection_card.parent_id)
        } else {
          routingStore.routeTo('homepage')
        }
      },
      onConfirm: () => uiStore.closeDialog(),
    })
  }

  updateCollection = async (attrs = {}) => {
    const { collection, uiStore } = this.props
    Object.keys(attrs).forEach(key => {
      collection[key] = attrs[key]
    })
    await collection.save()
    uiStore.update('submissionBoxSettingsOpen', false)
    uiStore.update('loadedSubmissions', true)
  }

  confirmSubmissionTemplateChange = ({ type, template } = {}, callback) => {
    const { uiStore, collection } = this.props
    if (collection.countSubmissions) {
      uiStore.confirm({
        iconName: 'Alert',
        prompt: `Are you sure?
                There are already ${collection.countSubmissions} submissions.
                New submissions will be
                ${template ? pluralize(template.name) : pluralize(`${type} item`)}.`,
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

  chooseTemplate = template => () => {
    this.confirmSubmissionTemplateChange({ template }, () => {
      this.updateCollection({
        submission_template_id: template.id,
        submission_box_type: 'template',
      })
    })
  }

  chooseSubmissionBoxType = type => () => {
    this.confirmSubmissionTemplateChange({ type }, () => {
      this.props.collection.submission_template = null
      this.updateCollection({
        submission_template_id: null,
        submission_box_type: type,
      })
    })
  }

  submissionBoxRowForItem = (typeName) => {
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
        onClick={this.chooseSubmissionBoxType(type.name)}
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

  submissionBoxRowForTemplate = (template) => (
    <SubmissionBoxRow
      key={template.id}
      noSpacing
      onClick={this.chooseTemplate(template)}
    >
      <ThumbnailHolder>
        { template.cover.image_url &&
          <img src={template.cover.image_url} alt={template.name} />
        }
        { !template.cover.image_url &&
          <TemplateIcon circled filled />
        }
      </ThumbnailHolder>
      <SubmissionBoxRowText>
        { template.name }
      </SubmissionBoxRowText>
    </SubmissionBoxRow>
  )

  selectedOption = () => {
    const { submission_template_id, submission_box_type } = this.props.collection
    const template = this.templates.find(t => t.id === submission_template_id)
    if (template) {
      return this.submissionBoxRowForTemplate(template)
    } else if (submission_box_type && submission_box_type !== 'template') {
      return this.submissionBoxRowForItem(submission_box_type)
    }
    return ''
  }

  titleContent = () => (
    <StyledTitleContent>
      <Heading2>Submission Box Settings</Heading2>
      <Row>
        <span style={{ display: 'inline-block', height: '25px', width: '25px', color: v.colors.gray }}>
          <AlertIcon />
        </span>
        <RowItemLeft>
          <SmallHelperText>
            Anyone invited to this collection box will be able to instantly create
            their own instance of the template that you choose. Use one of our
            templates or create your own.
          </SmallHelperText>
        </RowItemLeft>
      </Row>
      <Heading3>Submission Format</Heading3>
      { this.selectedOption() }
    </StyledTitleContent>
  )

  get itemRows() {
    const { submission_box_type } = this.props.collection
    const types = ['text', 'link', 'file']
    return _.filter(types, t => t !== submission_box_type).map(type => (
      this.submissionBoxRowForItem(type)
    ))
  }

  render() {
    const { submission_template_id } = this.props.collection
    return (
      <Modal
        title={this.titleContent()}
        onClose={this.handleClose}
        disableBackdropClick={this.locked}
        open
      >
        <div>
          { this.itemRows }
          {this.templates.map(template =>
            submission_template_id !== template.id && (
              this.submissionBoxRowForTemplate(template)
            ))
          }
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
