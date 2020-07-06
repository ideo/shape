import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, action, runInAction } from 'mobx'
import FormControl from '@material-ui/core/FormControl'
import _ from 'lodash'

import Button from '~/ui/global/Button'
import {
  Checkbox,
  LabelContainer,
  LabelTextStandalone,
  LabelHint,
} from '~/ui/global/styled/forms'
import { Heading2 } from '~/ui/global/styled/typography'
import TagEditor from '~/ui/pages/shared/TagEditor'
import TextEditor from '~/ui/global/TextEditor'
// import v from '~/utils/variables'

@inject('apiStore', 'routingStore', 'uiStore')
@observer
class OrganizationSettings extends React.Component {
  @observable
  bumpTermsVersion = false

  componentDidMount() {
    const { organization } = this
    // kick out if you're not an org admin (i.e. primary_group admin)
    if (!organization.primary_group.can_edit) {
      this.props.routingStore.routeTo('homepage')
    }
    if (organization.terms_version === null) {
      runInAction(() => {
        // always bump the terms when none exist
        this.bumpTermsVersion = true
      })
    }
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

  handleSaveTerms = ev => {
    ev.preventDefault()
    const { uiStore } = this.props
    const { organization } = this

    const onConfirm = async () => {
      const item = organization.terms_text_item
      await item.save()
      if (this.bumpTermsVersion) {
        await organization.API_bumpTermsVersion()
      }
      uiStore.popupSnackbar({ message: 'Terms of Use saved!' })
    }

    if (this.bumpTermsVersion) {
      uiStore.confirm({
        iconName: 'Alert',
        confirmText: 'Continue',
        prompt:
          'Are you sure you want all existing users to agree to these terms? You can not reverse this action.',
        onConfirm,
      })
    } else {
      onConfirm()
    }
  }

  @action
  handleTermsVersionChange = ev => {
    this.bumpTermsVersion = !this.bumpTermsVersion
  }

  renderTermsTextBox() {
    const { routingStore } = this.props
    const { organization } = this
    if (!organization.terms_text_item) return null

    return (
      <form>
        <TextEditor
          item={organization.terms_text_item}
          onExpand={() => routingStore.routeTo(`terms/${organization.slug}`)}
        />
        <Button style={{ marginTop: '24px' }} onClick={this.handleSaveTerms}>
          Save
        </Button>

        <FormControl
          style={{ marginLeft: '12px' }}
          component="fieldset"
          required
        >
          <LabelContainer
            classes={{ label: 'form-control' }}
            control={
              <Checkbox
                disabled={organization.terms_version === null}
                checked={this.bumpTermsVersion}
                onChange={this.handleTermsVersionChange}
              />
            }
            label={
              <div style={{ marginTop: '12px' }}>
                Require existing users to agree to updated Terms
              </div>
            }
          />
          <div style={{ height: '54px' }} />
        </FormControl>
      </form>
    )
  }

  validateDomainTag(domain) {
    let error = null
    let tag = null
    const matches = domain.match(/([a-z])([a-z0-9]+\.)*[a-z0-9]+\.[a-z.]+/g)
    if (!matches) {
      error = 'Invalid domain. Please use the format: domain.com'
    } else {
      tag = _.first(matches)
    }
    return {
      tag,
      error,
    }
  }

  @action
  addTag = ({ label }) => {
    const { domain_whitelist } = this.organization
    if (_.indexOf(domain_whitelist, label) < 0) {
      domain_whitelist.push(label)
      this.organization.patch()
    }
  }

  @action
  removeTag = ({ label }) => {
    _.pull(this.organization.domain_whitelist, label)
    this.organization.patch()
  }

  get domainWhiteListFormattedTags() {
    const { organization } = this
    const { domain_whitelist } = organization

    return _.map(domain_whitelist, label => {
      return {
        label,
      }
    })
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
          recordTags={this.domainWhiteListFormattedTags}
          afterAddTag={this.addTag}
          afterRemoveTag={this.removeTag}
          canEdit
          placeholder="Please enter domains with the following format: domain.com"
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
                <LabelHint>
                  If you choose to include your own Terms of Use you are
                  responsible for the contents, legal applicability and
                  enforcement of the same. By ticking this box you agree that in
                  any conflict between Shape’s Terms of Use and your own Terms
                  of Use, Shape’s shall prevail and you will not attempt to
                  reverse or alter the contractual relationship of Shape and its
                  Users, including in respect of liability.
                </LabelHint>
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
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrganizationSettings
