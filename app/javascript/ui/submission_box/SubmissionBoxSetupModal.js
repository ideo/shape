import _ from 'lodash'
import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
// import styled from 'styled-components'

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
`
const SubmissionBoxRowText = RowItemLeft.extend`
  padding-top: 0.75rem;
`

@inject('apiStore', 'uiStore', 'routingStore')
@observer
class SubmissionBoxSetupModal extends React.Component {
  @observable templates = []

  async componentDidMount() {
    const { apiStore } = this.props
    const other = ''
    let q = `#template ${other}`
    q = _.trim(q).replace(/\s/g, '+').replace(/#/g, '%23')
    // TODO: pagination?
    const res = await apiStore.request(`search?query=${q}`)
    runInAction(() => {
      this.templates = res.data.filter(c => c.isUsableTemplate)
    })
  }

  handleClose = (ev) => {
    const { apiStore, uiStore, routingStore, collection } = this.props
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

  updateCollection = (attrs = {}) => {
    const { collection } = this.props
    Object.keys(attrs).forEach(key => {
      collection[key] = attrs[key]
    })
    // can 'await' this call if we want to show any loading indicator?
    collection.save()
  }

  chooseTemplate = templateId => () => {
    this.updateCollection({
      submission_template_id: templateId,
      submission_box_type: 'template',
    })
  }

  chooseSubmissionBoxType = type => () => {
    this.updateCollection({
      submission_box_type: type,
    })
  }

  titleContent = () => (
    <div>
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
    </div>
  )

  get itemRows() {
    const types = [
      { name: 'text', Icon: AddTextIcon },
      { name: 'link', Icon: AddLinkIcon },
      { name: 'file', Icon: AddFileIcon },
    ]
    return types.map(type => (
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
    ))
  }

  render() {
    return (
      <Modal
        title={this.titleContent()}
        onClose={this.handleClose}
        disableBackdropClick
        open
      >
        <div>
          { this.itemRows }
          {this.templates.map(template => (
            <SubmissionBoxRow
              key={template.id}
              noSpacing
              onClick={this.chooseTemplate(template.id)}
            >
              <ThumbnailHolder>
                <img src={template.cover.image_url} alt={template.name} />
              </ThumbnailHolder>
              <SubmissionBoxRowText>
                { template.name }
              </SubmissionBoxRowText>
            </SubmissionBoxRow>
          ))}
        </div>
      </Modal>
    )
  }
}

SubmissionBoxSetupModal.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}
SubmissionBoxSetupModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default SubmissionBoxSetupModal
