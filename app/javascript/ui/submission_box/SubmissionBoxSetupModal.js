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
import AddTextIcon from '~/ui/icons/AddTextIcon'
import AddFileIcon from '~/ui/icons/AddFileIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
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

@inject('apiStore', 'uiStore')
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
    const { uiStore } = this.props
    uiStore.alert('no way!')
  }

  updateCollection = async (attrs = {}) => {
    const { collection } = this.props
    Object.keys(attrs).forEach(key => {
      collection[key] = attrs[key]
    })
    const res = await collection.save()
    console.log(res)
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
      <p>
        <SmallHelperText>
          Anyone invited to this collection box will be able to yadda yadda doodly doo.
        </SmallHelperText>
      </p>
      <Heading3>Submission Format</Heading3>
    </div>
  )

  get itemRows() {
    const types = [
      { name: 'text', Icon: AddTextIcon },
      { name: 'link', Icon: () => <LinkIcon viewBox="-11 -11 40 40" /> },
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
}

export default SubmissionBoxSetupModal
