import _ from 'lodash'
import { computed, action } from 'mobx'
import { prop } from 'datx'

import BaseRecord from './BaseRecord'
import CollectionCard from './CollectionCard'
import Role from './Role'

class Collection extends BaseRecord {
  attributesForAPI = ['name', 'tag_list']

  @prop.toMany(CollectionCard) collection_card
  @prop.toMany(Role) role

  @computed get cardIds() {
    return this.collection_cards.map(card => card.id)
  }

  @action removeCard(card) {
    this.collection_cards.splice(this.collection_cards.indexOf(card), 1)
    this._reorderCards()
  }

  @action removeCardIds(cardIds) {
    this.collection_cards.filter(card => (
      cardIds.indexOf(card.id) > -1
    )).forEach(card => this.collection_cards.splice(this.collection_cards.indexOf(card), 1))
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

  get isMasterTemplate() {
    return this.master_template
  }

  get isUsableTemplate() {
    // you aren't allowed to use the profile template
    return this.isMasterTemplate && !this.isProfileTemplate
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

  // this marks it with the "sirocco" special color
  // NOTE: could also use Collection::Global -- except OrgTemplates is not "special"?
  get isSpecialCollection() {
    return this.isSharedCollection ||
      this.isProfileTemplate ||
      this.isProfileCollection
  }

  get isNormalCollection() {
    return !this.isUserCollection &&
      !this.isSharedCollection
  }

  get isRequired() {
    return this.is_profile_template || this.isUserProfile
  }

  get isEmpty() {
    return this.collection_cards.length === 0
  }

  @action addCard(card) {
    this.collection_cards.unshift(card)
    this._reorderCards()
  }

  API_updateCards() {
    this._reorderCards()
    const data = this.toJsonApi()
    delete data.relationships
    // attach nested attributes of cards
    data.attributes.collection_cards_attributes = _.map(this.collection_cards, card => (
      _.pick(card, ['id', 'order', 'width', 'height'])
    ))
    // we don't want to receive updates which are just going to try to re-render
    data.cancel_sync = true
    const apiPath = `collections/${this.id}`
    return this.apiStore.request(apiPath, 'PATCH', { data })
  }

  // after we reorder a single card, we want to make sure everything goes into sequential order
  _reorderCards() {
    if (this.collection_cards) {
      return _.each(_.sortBy(this.collection_cards, 'order'), (card, i) => {
        card.order = i
      })
    }
    return false
  }

  checkCurrentOrg() {
    const { currentUser } = this.apiStore
    if (!currentUser) return
    if (this.organization_id !== currentUser.current_organization.id) {
      currentUser.switchOrganization(this.organization_id)
    }
  }
}
Collection.type = 'collections'

export default Collection
