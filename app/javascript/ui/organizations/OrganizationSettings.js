import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction } from 'mobx'
import FormControl from '@material-ui/core/FormControl'

import {
  Checkbox,
  LabelContainer,
  LabelTextStandalone,
} from '~/ui/global/styled/forms'
import { Heading2, SmallHelperText } from '~/ui/global/styled/typography'
import TagEditor from '~/ui/pages/shared/TagEditor'
import TextEditor from '~/ui/global/TextEditor'
import v from '~/utils/variables'

@inject('apiStore', 'routingStore')
@observer
class OrganizationSettings extends React.Component {
  componentDidMount() {
    // kick out if you're not an org admin (i.e. primary_group admin)
    if (!this.organization.primary_group.can_edit) {
      this.props.routingStore.routeTo('homepage')
    }
    const { apiStore } = this.props
    apiStore.fetch('organizations', this.organization.id)
  }

  get organization() {
    const { apiStore } = this.props
    return apiStore.currentUserOrganization
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

  renderTermsTextBox() {
    if (!this.organization.terms_text_item) return null

    return <TextEditor item={this.organization.terms_text_item} />
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
                  {`Include ${this.organization.name} Terms of Use `}
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
