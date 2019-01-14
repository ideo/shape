import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction } from 'mobx'
import FormControl from '@material-ui/core/FormControl'
import ReactQuill from 'react-quill'

import {
  Checkbox,
  FormButton,
  LabelContainer,
  LabelTextStandalone,
} from '~/ui/global/styled/forms'
import {
  Heading2,
  SmallHelperText,
  QuillStyleWrapper,
} from '~/ui/global/styled/typography'
import TagEditor from '~/ui/pages/shared/TagEditor'
import TextItemToolbar from '~/ui/items/TextItemToolbar'
import v from '~/utils/variables'

@inject('apiStore', 'routingStore')
@observer
class OrganizationSettings extends React.Component {
  constructor() {
    super()
    this.quillEditor = undefined
  }

  componentDidMount() {
    // kick out if you're not an org admin (i.e. primary_group admin)
    if (!this.organization.primary_group.can_edit) {
      this.props.routingStore.routeTo('homepage')
    }
    const { apiStore } = this.props
    apiStore.fetch('organizations', this.organization.id)
    this.attachQuillRefs()
  }

  componentDidUpdate() {
    this.attachQuillRefs()
  }

  attachQuillRefs = () => {
    if (!this.reactQuillRef) return
    if (typeof this.reactQuillRef.getEditor !== 'function') return
    this.quillEditor = this.reactQuillRef.getEditor()
  }

  get organization() {
    const { apiStore } = this.props
    return apiStore.currentUserOrganization
  }

  handleChange = (content, delta, source, editor) => {
    const { quillEditor } = this
    const item = this.organization.terms_text_item
    setTimeout(() => {
      runInAction(() => {
        item.content = quillEditor.root.innerHTML
        item.text_data = quillEditor.getContents()
      })
    }, 5)
  }

  handleBlur = (range, source, editor) => {
    const selection = editor.getSelection()
    if (selection) {
      // we just pasted... so blur + refocus to stay within the editor
      this.quillEditor.blur()
      this.quillEditor.focus()
    }
  }

  handleSave = ev => {
    ev.preventDefault()
    const item = this.organization.terms_text_item
    item.save()
  }

  handleCustomTermToggle = async ev => {
    ev.preventDefault()
    if (this.organization.terms_text_item_id) {
      runInAction(() => {
        this.organization.terms_text_item = null
        delete this.organization.terms_text_item
      })
      return this.organization.API_removeTermsTextItem()
    }
    return this.organization.API_createTermsTextItem()
  }

  afterDomainWhitelistUpdate = () => {
    // need to reload in case updating the domains altered any group memberships
    const { apiStore } = this.props
    apiStore.loadCurrentUserGroups({ orgOnly: true })
  }

  get textData() {
    const item = this.organization.terms_text_item
    return item.toJSON().text_data
  }

  renderTermsTextBox() {
    if (!this.organization.terms_text_item) return null

    const quillProps = {
      ...v.quillDefaults,
      ref: c => {
        this.reactQuillRef = c
      },
      theme: 'snow',
      onChange: this.handleChange,
      onBlur: this.handleBlur,
      readOnly: false,
      modules: {
        toolbar: '#quill-toolbar',
      },
    }
    return (
      <form>
        <div
          style={{
            background: 'white',
            maxWidth: '850px',
            padding: '6px 10px',
          }}
        >
          <TextItemToolbar fullPageView onExpand={() => {}} />
          <QuillStyleWrapper>
            <ReactQuill {...quillProps} value={this.textData} />
          </QuillStyleWrapper>
        </div>
        <FormButton onClick={this.handleSave}>Save</FormButton>
      </form>
    )
  }

  render() {
    return (
      <div>
        <Heading2>Official Domains</Heading2>
        <p>
          Any new people added to {this.organization.name} without these email
          domains will be considered guests.
        </p>

        <TagEditor
          canEdit
          validate="domain"
          placeholder="Please enter domains with the following format: domain.com"
          record={this.organization}
          tagField="domain_whitelist"
          tagColor="white"
          afterSave={this.afterDomainWhitelistUpdate}
        />
        <br />
        <Heading2>Terms of Use</Heading2>
        <FormControl component="fieldset" required>
          <LabelContainer
            classes={{ label: 'form-control' }}
            labelPlacement={'end'}
            control={
              <Checkbox
                checked={!!this.organization.terms_text_item_id}
                onChange={this.handleCustomTermToggle}
                value="yes"
              />
            }
            label={
              <div style={{ maxWidth: '582px' }}>
                <LabelTextStandalone>
                  {`Include ${this.organization.termsName} Terms of Use `}
                </LabelTextStandalone>
                <SmallHelperText color={v.colors.commonDark}>
                  If you choose to include your own Terms of Use you are
                  responsible for the contents, legal applicability and
                  enforcement of the same. By ticking this box you agree that in
                  any conflict between Shape’s Terms of Use and your own Terms
                  of Use, Shape’s shall prevail and you will not attempt to
                  reverse or alter the contractual relationship of Shape and its
                  Users, including in respect of liability.
                </SmallHelperText>
              </div>
            }
          />
          <div style={{ height: '54px' }} />
        </FormControl>
        {this.renderTermsTextBox()}
      </div>
    )
  }
}

OrganizationSettings.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrganizationSettings
