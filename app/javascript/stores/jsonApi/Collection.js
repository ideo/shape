import _ from 'lodash'
import { observable, computed, action, runInAction } from 'mobx'
import { ReferenceType } from 'datx'
import pluralize from 'pluralize'

import { apiStore, routingStore, uiStore } from '~/stores'
import { apiUrl } from '~/utils/url'

import BaseRecord from './BaseRecord'
import CollectionCard from './CollectionCard'
import SharedRecordMixin from './SharedRecordMixin'

class Collection extends SharedRecordMixin(BaseRecord) {
  static type = 'collections'
  static endpoint = apiUrl('collections')

  // starts null before it is loaded
  @observable
  inMyCollection = null
  @observable
  reloading = false
  @observable
  nextAvailableTestPath = null

  attributesForAPI = [
    'name',
    'tag_list',
    'submission_template_id',
    'submission_box_type',
    'collection_to_test_id',
  ]

  @computed
  get cardIds() {
    return this.collection_cards.map(card => card.id)
  }

  @action
  removeCard(card) {
    this.collection_cards.splice(this.collection_cards.indexOf(card), 1)
    this._reorderCards()
  }

  @action
  removeCardIds(cardIds) {
    this.collection_cards
      .filter(card => cardIds.indexOf(card.id) > -1)
      .forEach(card =>
        this.collection_cards.splice(this.collection_cards.indexOf(card), 1)
      )
    this._reorderCards()
  }

  @action
  toggleEditWarnings() {
    if (this.snoozedEditWarningsAt) {
      this.snoozedEditWarningsAt = undefined
    } else {
      this.snoozedEditWarningsAt = Date.now()
    }
    uiStore.setSnoozeChecked(!!this.snoozedEditWarningsAt)
  }

  @action
  setReloading(value) {
    this.reloading = value
  }

  get shouldShowEditWarning() {
    if (!this.isMasterTemplate || this.template_num_instances === 0)
      return false
    // if we already have the confirmation open, don't try to re-open
    if (uiStore.dialogConfig.open === 'confirm') return false
    const oneHourAgo = Date.now() - 1000 * 60 * 60
    if (!this.snoozedEditWarningsAt) return true
    if (this.snoozedEditWarningsAt < oneHourAgo) {
      runInAction(() => {
        // reset the state if time has elapsed, otherwise checkbox remains checked
        this.snoozedEditWarningsAt = undefined
      })
      return true
    }
    return false
  }

  get editWarningPrompt() {
    let prompt = 'Are you sure?'
    const num = this.template_num_instances
    prompt += ` ${num} ${pluralize('instance', num)}`
    prompt += ` of this template will be affected.`
    return prompt
  }

  get confirmEditOptions() {
    const iconName = 'Template'
    const confirmText = 'Continue'
    const onToggleSnoozeDialog = () => {
      this.toggleEditWarnings()
    }
    return {
      prompt: this.editWarningPrompt,
      confirmText,
      iconName,
      snoozeChecked: !this.shouldShowEditWarning,
      onToggleSnoozeDialog,
    }
  }

  // confirmEdit will check if we're in a template and need to confirm changes,
  // otherwise it will just call onConfirm()
  confirmEdit({ onCancel, onConfirm }) {
    if (!this.shouldShowEditWarning) return onConfirm()
    uiStore.confirm({
      ...this.confirmEditOptions,
      onCancel: () => {
        if (onCancel) onCancel()
      },
      onConfirm: () => onConfirm(),
    })
    return true
  }

  get organization() {
    return this.apiStore.find('organizations', this.organization_id)
  }

  get isUserCollection() {
    return this.type === 'Collection::UserCollection'
  }

  get isSharedCollection() {
    return this.type === 'Collection::SharedWithMeCollection'
  }

  get isSubmissionBox() {
    return this.type === 'Collection::SubmissionBox'
  }

  get isSubmissionsCollection() {
    return this.type === 'Collection::SubmissionsCollection'
  }

  get isSubmission() {
    return this.submission_attrs && this.submission_attrs.submission
  }

  get isSubmissionBoxTemplateOrTest() {
    return (
      this.is_submission_box_template ||
      (this.submission_attrs && this.submission_attrs.template)
    )
  }

  get isTestCollection() {
    return this.type === 'Collection::TestCollection'
  }

  get isTestDesign() {
    return this.type === 'Collection::TestDesign'
  }

  get isTestCollectionOrTestDesign() {
    return this.isTestCollection || this.isTestDesign
  }

  get requiresSubmissionBoxSettings() {
    if (!this.isSubmissionBox) return false
    // if type is null then it requires setup
    return !this.submission_box_type
  }

  get submissionTypeName() {
    const { submission_template } = this
    return submission_template ? submission_template.name : 'Submission'
  }

  get countSubmissions() {
    if (!this.isSubmissionBox) return 0
    const { submissions_collection } = this
    return submissions_collection
      ? submissions_collection.collection_cards.length
      : 0
  }

  get isMasterTemplate() {
    return this.master_template
  }

  get isUsableTemplate() {
    // you aren't allowed to use the profile template;
    // you also don't use test templates, since duplicating them or
    // creating them within another template is the way to do that
    return (
      this.isMasterTemplate &&
      !this.isProfileTemplate &&
      !this.is_submission_box_template &&
      !this.isTestDesign &&
      !this.isTestCollection
    )
  }

  get requiresTestDesigner() {
    // this determines if it should display the TestDesigner in CollectionPage,
    return (
      this.isTestDesign ||
      (this.isTestCollection && this.test_status === 'draft') ||
      this.is_submission_box_template_test
    )
  }

  get launchableTestId() {
    if (this.isTestCollection) {
      return this.id
    } else if (this.isTestDesign) {
      return this.test_collection_id
    } else if (this.submission_attrs) {
      return this.submission_attrs.launchable_test_id
    }
    return undefined
  }

  @computed
  get launchableTestStatus() {
    if (this.isTestCollectionOrTestDesign) {
      return this.test_status
    }
    if (!this.submission_attrs) return null
    return this.submission_attrs.test_status
  }

  get isDraftTest() {
    // NOTE: we show this even if the test is not necessarily "launchable", so that you can click it and see why
    return this.launchableTestStatus === 'draft'
  }

  get isLiveTest() {
    return this.launchableTestStatus === 'live'
  }

  get isClosedTest() {
    return this.launchableTestStatus === 'closed'
  }

  get publicTestURL() {
    // TODO: for the submission_box_template_test, this will eventually go to the global "submission box test link"
    return `${process.env.BASE_HOST}/tests/${this.launchableTestId}`
  }

  get isTemplated() {
    return !!this.template_id
  }

  get isUserProfile() {
    return this.type === 'Collection::UserProfile'
  }

  get isCurrentUserProfile() {
    if (!this.isUserProfile) return false
    return this.id === this.apiStore.currentUser.user_profile_collection_id
  }

  get isProfileTemplate() {
    return this.is_profile_template
  }

  get isProfileCollection() {
    return this.is_profile_collection
  }

  get isOrgTemplateCollection() {
    return this.is_org_template_collection
  }

  // disable cardMenu actions for certain collections
  get menuDisabled() {
    return this.isSharedCollection
  }

  get cardProperties() {
    return this.collection_cards.map(c =>
      _.pick(c, ['id', 'order', 'width', 'height'])
    )
  }

  // this marks it with the "offset" special color
  // NOTE: could also use Collection::Global -- except OrgTemplates is not "special"?
  get isSpecialCollection() {
    return (
      this.isSharedCollection ||
      this.isProfileTemplate ||
      this.isProfileCollection
    )
  }

  get isNormalCollection() {
    return !this.isUserCollection && !this.isSharedCollection
  }

  get isRequired() {
    return this.is_profile_template || this.isUserProfile
  }

  get isEmpty() {
    return this.collection_cards.length === 0
  }

  @action
  addCard(card) {
    this.collection_cards.unshift(card)
    this._reorderCards()
  }

  toJsonApiWithCards() {
    const data = this.toJsonApi()
    delete data.relationships
    // attach nested attributes of cards
    if (this.collection_cards) {
      data.attributes.collection_cards_attributes = _.map(
        this.collection_cards,
        card => _.pick(card, ['id', 'order', 'width', 'height'])
      )
    }
    return data
  }

  API_updateCards({ card, updates, undoMessage } = {}) {
    // this works a little differently than the typical "undo" snapshot...
    // we snapshot the collection_cards.attributes so that they can be reverted
    const jsonData = this.toJsonApiWithCards()
    this.pushUndo({
      snapshot: jsonData.attributes,
      message: undoMessage,
    })
    // now actually make the change to the card
    _.assign(card, updates)

    this._reorderCards()
    const data = this.toJsonApiWithCards()
    // we don't want to receive updates which are just going to try to re-render
    data.cancel_sync = true
    const apiPath = `collections/${this.id}`
    return this.apiStore.request(apiPath, 'PATCH', { data })
  }

  // after we reorder a single card, we want to make sure everything goes into sequential order
  @action
  _reorderCards() {
    if (this.collection_cards) {
      this.collection_cards.replace(_.sortBy(this.collection_cards, 'order'))
      _.each(this.collection_cards, (card, i) => {
        card.order = i
      })
    }
  }

  checkCurrentOrg() {
    const { currentUser } = this.apiStore
    if (!currentUser) return
    if (
      this.organization_id.toString() !== currentUser.current_organization.id
    ) {
      currentUser.switchOrganization(this.organization_id)
    }
  }

  checkLaunchability() {
    if (!this.can_edit_content || !this.launchable) {
      // TODO: More specific messaging around why e.g. if this is a submission template...
      let message = 'Only editors are allowed to launch the test.'
      if (this.is_submission_box_template_test) {
        message =
          'You must close any other live tests before launching this one.'
      }
      uiStore.alert(message)
      return false
    }
    return true
  }

  launchTest = () => this._performTestAction('launch')

  closeTest = () => {
    const onConfirm = () => this._performTestAction('close')
    if (this.isSubmissionBoxTemplateOrTest) {
      let prompt = 'Are you sure you want to stop all active tests?'
      const num = this.template_num_instances
      prompt += ` ${num} ${pluralize('submission', num)} will be affected.`
      return uiStore.confirm({
        iconName: 'Alert',
        prompt,
        confirmText: 'Stop feedback',
        cancelText: 'No',
        onConfirm,
      })
    }
    return onConfirm()
  }

  reopenTest = () => this._performTestAction('reopen')

  async _fetchSubmissionTest() {
    // if it's a submission we have to look up its test in order to launch
    if (!this.launchableTestId) return false
    const res = await this.apiStore.fetch('collections', this.launchableTestId)
    return res.data
  }

  async _performTestAction(actionName) {
    // possible actions = 'launch', 'close', 'reopen'
    if (!_.includes(['launch', 'close', 'reopen'], actionName)) return false
    let collection = this
    if (this.submission_attrs) {
      collection = await this._fetchSubmissionTest()
    }
    if (_.includes(['launch', 'reopen'], actionName)) {
      if (collection.checkLaunchability()) {
        // called with 'this' so that we know if the submission is calling it
        return this.API_performTestAction(actionName)
      }
      return false
    }
    // e.g. for close
    return this.API_performTestAction(actionName)
  }

  API_performTestAction = async actionName => {
    // this will disable any test launch/close/reopen buttons until loading is complete
    uiStore.update('launchButtonLoading', true)
    try {
      await this.apiStore
        .request(
          `test_collections/${this.launchableTestId}/${actionName}`,
          'PATCH'
        )
        .catch(err => {
          const errorMessages = err.error.map(e => ` ${e.detail}`)
          let prompt = `You have questions that have not yet been finalized:\n
             ${errorMessages}
            `
          // omit the extra wording for close and reopen
          // for reopen: what if there are actually incomplete questions... ?
          if (_.includes(['close', 'reopen'], actionName))
            prompt = errorMessages
          uiStore.popupAlert({
            prompt,
            fadeOutTime: 10 * 1000,
          })
        })
    } catch (e) {
      uiStore.update('launchButtonLoading', false)
    }
    uiStore.update('launchButtonLoading', false)
    // refetch yourself
    if (this.submission_attrs) this.apiStore.request(`collections/${this.id}`)
    if (this.parent && this.parent.submission_attrs) {
      this.apiStore.request(`collections/${this.parent.id}`)
    }
  }

  API_setSubmissionBoxTemplate(data) {
    return this.apiStore.request(
      `collections/set_submission_box_template`,
      'POST',
      data
    )
  }

  async API_getNextAvailableTest() {
    runInAction(() => {
      this.nextAvailableTestPath = null
    })
    const res = await this.apiStore.request(
      `test_collections/${this.id}/next_available`
    )
    if (!res.data) return
    const path = routingStore.pathTo('collections', res.data.id)

    this.setNextAvailableTestPath(`${path}?open=tests`)
  }

  @action
  setNextAvailableTestPath(path) {
    this.nextAvailableTestPath = path
  }

  reassignCover(newCover) {
    const previousCover = this.collection_cards
      .filter(cc => cc !== newCover)
      .find(cc => cc.is_cover === true)
    if (!previousCover) return
    previousCover.is_cover = false
  }

  static fetchSubmissionsCollection(id, { order } = {}) {
    return apiStore.request(`collections/${id}?card_order=${order}`)
  }

  async API_sortCards() {
    const order = uiStore.collectionCardSortOrder
    this.setReloading(true)
    await this.apiStore.request(`collections/${this.id}?card_order=${order}`)
    this.setReloading(false)
  }

  static async createSubmission(parent_id, submissionSettings) {
    const { type, template } = submissionSettings
    if (type === 'template' && template) {
      const templateData = {
        template_id: template.id,
        parent_id,
        placement: 'beginning',
      }
      uiStore.update('isLoading', true)
      const res = await apiStore.createTemplateInstance(templateData)
      uiStore.update('isLoading', false)
      routingStore.routeTo('collections', res.data.id)
    } else {
      uiStore.openBlankContentTool({
        order: 0,
        collectionId: parent_id,
        blankType: type,
      })
    }
  }
}

Collection.refDefaults = {
  collection_cards: {
    model: CollectionCard,
    type: ReferenceType.TO_MANY,
    defaultValue: [],
  },
}

export default Collection
