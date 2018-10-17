import _ from 'lodash'
import { observable, computed, action } from 'mobx'
import { ReferenceType } from 'datx'

import { apiStore, routingStore, uiStore } from '~/stores'
import BaseRecord from './BaseRecord'
import CollectionCard from './CollectionCard'
import SharedRecordMixin from './SharedRecordMixin'

class Collection extends SharedRecordMixin(BaseRecord) {
  static type = 'collections'

  // starts null before it is loaded
  @observable
  inMyCollection = null

  attributesForAPI = [
    'name',
    'tag_list',
    'submission_template_id',
    'submission_box_type',
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
    // you aren't allowed to use the profile template
    return this.isMasterTemplate && !this.isProfileTemplate
  }

  get isLaunchableTest() {
    return this.isTestCollectionOrTestDesign && this.test_status === 'draft'
  }

  get isLiveTest() {
    return this.isTestCollectionOrTestDesign && this.test_status === 'live'
  }

  get isClosedTest() {
    return this.isTestCollectionOrTestDesign && this.test_status === 'closed'
  }

  get publicTestURL() {
    return `${process.env.BASE_HOST}/tests/${this.testCollectionId}`
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

  get testCollectionId() {
    if (this.isTestCollection) return this.id
    if (this.isTestDesign && this.parent_collection_card) {
      return this.parent_collection_card.parent_id
    }
    return undefined
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
    data.attributes.collection_cards_attributes = _.map(
      this.collection_cards,
      card => _.pick(card, ['id', 'order', 'width', 'height'])
    )
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

  launchTest = () => {
    if (!this.can_edit) {
      uiStore.alert('Only editors are allowed to launch the test.')
      return
    }
    this.API_launchTest()
  }

  closeTest = async () => {
    await this.API_closeTest()
  }

  reopenTest = async () => {
    await this.API_reopenTest()
  }

  API_launchTest() {
    this.apiStore
      .request(`test_collections/${this.testCollectionId}/launch`, 'PATCH')
      .catch(err => {
        uiStore.popupAlert({
          prompt: `You have questions that have not yet been finalized:\n
           ${err.error.map(e => ` ${e.detail}`)}
          `,
          fadeOutTime: 10 * 1000,
        })
      })
  }

  API_closeTest(collectionId) {
    this.apiStore.request(
      `test_collections/${this.testCollectionId}/close`,
      'PATCH'
    )
  }

  API_reopenTest() {
    this.apiStore.request(
      `test_collections/${this.testCollectionId}/reopen`,
      'PATCH'
    )
  }

  reassignCover(newCover) {
    const previousCover = this.collection_cards
      .filter(cc => cc !== newCover)
      .find(cc => cc.is_cover === true)
    previousCover.is_cover = false
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
