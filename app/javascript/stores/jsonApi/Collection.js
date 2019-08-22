import _ from 'lodash'
import axios from 'axios'
import { observable, computed, action, runInAction } from 'mobx'
import { ReferenceType } from 'datx'
import pluralize from 'pluralize'
import queryString from 'query-string'
import googleTagManager from '~/vendor/googleTagManager'

// TODO: remove this apiStore import by refactoring static methods that depend on it
import { apiStore } from '~/stores'
import { apiUrl } from '~/utils/url'

import CardMoveService from '~/ui/grid/CardMoveService'
import BaseRecord from './BaseRecord'
import CollectionCard from './CollectionCard'
import Role from './Role'
import TestAudience from './TestAudience'
import SharedRecordMixin from './SharedRecordMixin'
import { POPUP_ACTION_TYPES } from '~/enums/actionEnums'

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
  @observable
  currentPage = 1
  @observable
  currentOrder = 'order'
  @observable
  totalPages = 1
  recordsPerPage = 50
  @observable
  scrollBottom = 0
  @observable
  storedCacheKey = null

  attributesForAPI = [
    'name',
    'tag_list',
    'submission_template_id',
    'submission_box_type',
    'collection_to_test_id',
  ]

  @computed
  get cardIds() {
    return this.sortedCards.map(card => card.id)
  }

  @computed
  get hasMore() {
    return this.totalPages > this.currentPage
  }

  @computed
  get nextPage() {
    return this.currentPage + 1
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
    this.uiStore.setSnoozeChecked(!!this.snoozedEditWarningsAt)
  }

  @action
  setReloading(value) {
    this.reloading = value
  }

  cardIdsBetween(firstCardId, lastCardId) {
    if (this.isBoard) {
      return this.cardIdsBetweenByColRow(firstCardId, lastCardId)
    }
    // For all other collection types, find cards by order
    return this.cardIdsBetweenByOrder(firstCardId, lastCardId)
  }

  // Find all cards that are between these two card ids,
  // using the card order
  cardIdsBetweenByOrder(firstCardId, lastCardId) {
    const firstIdx = this.cardIds.findIndex(id => id === firstCardId)
    const lastIdx = this.cardIds.findIndex(id => id === lastCardId)
    const cardIdsBetween = [...this.cardIds]
    // Cards are in sorted order, so slice out the right card Ids
    if (lastIdx > firstIdx) {
      return cardIdsBetween.slice(firstIdx, lastIdx)
    }
    return cardIdsBetween.slice(lastIdx, firstIdx)
  }

  get cardMatrix() {
    if (this.collection_cards.length === 0) return [[]]

    // Get maximum dimensions of our card matrix
    const maxCol = _.max(this.collection_cards.map(card => card.maxCol))
    const maxRow = _.max(this.collection_cards.map(card => card.maxRow))

    // Create matrix of arrays, each row having an array with the 'columns'
    // Since row and col are zero-indexed, add 1
    const matrix = _.map(new Array(maxRow + 1), row => new Array(maxCol + 1))

    // Iterate through each card to populate the matrix
    _.each(this.collection_cards, card => {
      // Create a range with the min and max row and column that this card occupies
      // range does not include last value, so increment max by 1
      const rows = _.range(card.row, card.maxRow + 1)
      const cols = _.range(card.col, card.maxCol + 1)

      // Iterate over each to populate the matrix
      _.each(rows, row => {
        _.each(cols, col => {
          matrix[row][col] = card
        })
      })
    })
    return matrix
  }

  minMaxRowColForCards = cards =>
    // Find the min/max rows of what they have selected,
    // keeping in mind a card's area needs to contribute to width/height
    ({
      minRow: _.min(cards.map(card => card.row)),
      maxRow: _.max(cards.map(card => card.maxRow)),
      minCol: _.min(cards.map(card => card.col)),
      maxCol: _.max(cards.map(card => card.maxCol)),
    })

  // Find all cards that are between these two card ids,
  // using the card row & col
  cardIdsBetweenByColRow(firstCardId, lastCardId) {
    const cards = this.collection_cards.filter(
      card => card.id === firstCardId || card.id === lastCardId
    )
    const minMax = this.minMaxRowColForCards(cards)
    const rowRange = _.range(minMax.minRow, minMax.maxRow + 1)
    const colRange = _.range(minMax.minCol, minMax.maxCol + 1)

    // Find all cards that are within the rectangle created
    // between the first and last selected cards
    const matrix = this.cardMatrix
    const cardIds = []
    _.each(rowRange, row => {
      _.each(colRange, col => {
        const card = matrix[row][col]
        if (card && !_.includes(cardIds, card.id)) cardIds.push(card.id)
      })
    })

    return cardIds
  }

  cardIdsWithinRectangle(minCoords, maxCoords) {
    const rowRange = _.range(minCoords.row, maxCoords.row + 1)
    const colRange = _.range(minCoords.col, maxCoords.col + 1)

    const matrix = this.cardMatrix
    const cardIds = []
    _.each(rowRange, row => {
      _.each(colRange, col => {
        const card = matrix[row] && matrix[row][col]
        if (card && !_.includes(cardIds, card.id)) cardIds.push(card.id)
      })
    })

    return cardIds
  }

  get shouldShowEditWarning() {
    if (!this.isMasterTemplate || this.template_num_instances === 0)
      return false
    // if we already have the confirmation open, don't try to re-open
    if (this.uiStore.dialogConfig.open === 'confirm') return false
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
    this.uiStore.confirm({
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

  get isCollection() {
    return true
  }

  get isUserCollection() {
    return this.type === 'Collection::UserCollection'
  }

  get isSharedCollection() {
    return this.type === 'Collection::SharedWithMeCollection'
  }

  get canSetACover() {
    return !this.isSharedCollection && !this.isUserCollection
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

  get isHiddenSubmission() {
    if (!this.isSubmission) return false
    return this.is_inside_hidden_submission_box && this.submission_attrs.hidden
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

  get isBoard() {
    return this.type === 'Collection::Board'
  }

  get isPublicJoinable() {
    return this.anyone_can_join && !this.apiStore.currentUser
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
      !!this.isMasterTemplate &&
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

  @computed
  get cardProperties() {
    return this.collection_cards.map(c => _.pick(c, ['id', 'updated_at']))
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

  toJsonApiWithCards(onlyCardIds = []) {
    const data = this.toJsonApi()
    // attach nested attributes of cards
    if (this.collection_cards) {
      const cardAttributes = []
      _.each(this.collection_cards, card => {
        if (
          onlyCardIds.length === 0 ||
          (onlyCardIds && onlyCardIds.indexOf(card.id) !== -1)
        ) {
          cardAttributes.push(_.pick(card, card.batchUpdateAttributes))
        }
      })
      data.attributes.collection_cards_attributes = cardAttributes
    }
    return data
  }

  async API_fetchCards({
    page = 1,
    per_page = null,
    order,
    hidden = false,
    rows,
    cols,
  } = {}) {
    runInAction(() => {
      if (order) this.currentOrder = order
    })
    const params = {
      page,
      per_page,
    }
    if (!params.per_page) {
      // NOTE: If this is a Board, per_page will be ignored in favor of default 16x16 rows/cols
      params.per_page = this.recordsPerPage
    }
    if (this.currentOrder !== 'order') {
      params.card_order = this.currentOrder
    }
    if (hidden) {
      params.hidden = true
    }
    if (rows && cols) {
      params.rows = rows
      params.cols = cols
    }
    const apiPath = `collections/${
      this.id
    }/collection_cards?${queryString.stringify(params, {
      arrayFormat: 'bracket',
    })}`
    const res = await this.apiStore.request(apiPath)
    const { data, links } = res
    runInAction(() => {
      this.totalPages = links.last
      this.currentPage = page
      if (page === 1 && this.storedCacheKey !== this.cache_key) {
        this.storedCacheKey = this.cache_key
        this.collection_cards.replace(data)
      } else {
        // NOTE: (potential pre-optimization) if collection_cards grows in size,
        // at some point do we reset back to a reasonable number?
        const newData = _.reverse(
          // de-dupe merged data (deferring to new cards first)
          // reverse + reverse so that new cards (e.g. page 2) are replaced first but then put back at the end
          _.unionBy(
            _.reverse([...data]),
            _.reverse([...this.collection_cards]),
            'id'
          )
        )
        this.collection_cards.replace(newData)
      }
    })
  }

  /*
  Perform batch updates on multiple cards at once

  updates (array)
    An array of objects with a card reference and the updated attributes, e.g.
    [
      { card: card instance, order: 2  },
      { card: card instance, order: 4  },
    ]

  updateAllCards (bool)
    If true, it will send data to the API for all collection cards
    (useful for regular collections where order needs to be updated on all cards).

    If false, will only send data about updated cards.
  */

  API_batchUpdateCards({ updates, updateAllCards }) {
    const updatesByCardId = {}
    _.each(updates, update => {
      updatesByCardId[update.card.id] = update
    })
    let minOrder = _.minBy(updates, 'order')
    minOrder = minOrder ? minOrder.order : 0
    let maxOrder = _.maxBy(updates, 'order')
    maxOrder = maxOrder ? maxOrder.order : 0
    const moveOrder = _.min([minOrder, maxOrder])

    // Apply all updates to in-memory cards
    _.each(this.collection_cards, card => {
      // Apply updates to each card
      const cardUpdates = updatesByCardId[card.id]
      if (cardUpdates) {
        // Pick out allowed values and assign them
        const allowedAttrs = _.pick(cardUpdates, card.batchUpdateAttributes)
        _.forEach(allowedAttrs, (value, key) => {
          card[key] = value
        })
      } else if (moveOrder && card.order >= moveOrder) {
        // make sure this card gets bumped out of the way of our moving ones
        card.order += maxOrder
      }
      // force the grid to immediately observe that things have changed
      card.updated_at = new Date()
    })

    this._reorderCards()

    const data = this.toJsonApiWithCards(
      updateAllCards ? [] : _.keys(updatesByCardId)
    )

    // Persist updates to API
    return this.apiStore.request(`collections/${this.id}`, 'PATCH', { data })
  }

  /*
  Perform batch updates on multiple cards at once,
  and captures current cards state to undo to

  updates (array)
    An array of objects with a card reference and the updated attributes, e.g.
    [
      { card: card instance, row: 4, col: 3  },
      { card: card instance, row: 4, col: 4  },
    ]

  updateAllCards (bool)
    If false, will only send data about updated cards.

    If true, it will send data to the API for all collection cards
    (useful for regular collections where order needs to be updated on all cards).

  undoMessage (string) - a message to display if someone undoes the action
  onConfirm (optional function) - a function to run once user confirms update
  onCancel (optional function)  - a function to call if they cancel performing update

  */
  API_batchUpdateCardsWithUndo({
    updates,
    updateAllCards = false,
    undoMessage,
    onConfirm,
    onCancel,
  }) {
    const cardIds = []
    const updatesByCardId = {}
    _.each(updates, update => {
      cardIds.push(update.card.id)
      updatesByCardId[update.card.id] = update
    })

    const performUpdate = () => {
      // close MoveMenu e.g. if you were dragging from MDL
      this.uiStore.closeMoveMenu()
      // Store snapshot of existing cards so changes can be un-done
      const cardsData = this.toJsonApiWithCards(updateAllCards ? [] : cardIds)

      this.pushUndo({
        snapshot: cardsData.attributes,
        message: undoMessage,
        redoAction: {
          message: 'Move redone',
          apiCall: () =>
            // re-call the same function
            this.API_batchUpdateCardsWithUndo({
              updates,
              updateAllCards,
              undoMessage,
              onConfirm,
              onCancel,
            }),
        },
        actionType: POPUP_ACTION_TYPES.SNACKBAR,
      })

      return this.API_batchUpdateCards({ updates, updateAllCards }).then(
        res => {
          if (onConfirm) onConfirm()
        }
      )
    }

    // Show a dialog if in a template
    return this.confirmEdit({
      onCancel,
      onConfirm: performUpdate,
    })
  }

  API_selectDatasetsWithIdentifier({ identifier }) {
    return this.apiStore.request(
      `collections/${this.id}/datasets/select`,
      'POST',
      { identifier }
    )
  }

  API_unselectDatasetsWithIdentifier({ identifier }) {
    return this.apiStore.request(
      `collections/${this.id}/datasets/unselect`,
      'POST',
      { identifier }
    )
  }

  @computed
  get sortedCards() {
    return _.sortBy(this.collection_cards, 'order')
  }

  // after we reorder a single card, we want to make sure everything goes into sequential order
  @action
  _reorderCards() {
    // NOTE: this should work ok even if there are infinite scroll / pagination cards
    // not being displayed offscreen...
    if (this.collection_cards) {
      _.each(this.sortedCards, (card, i) => {
        card.order = i
      })
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
      this.uiStore.alert(message)
      return false
    }
    return true
  }

  launchTest = (audiences = null) =>
    this._performTestAction('launch', audiences)

  closeTest = () => {
    const onConfirm = () => this._performTestAction('close')
    if (this.isSubmissionBoxTemplateOrTest) {
      let prompt = 'Are you sure you want to stop all active tests?'
      const num = this.template_num_instances
      prompt += ` ${num} ${pluralize('submission', num)} will be affected.`
      return this.uiStore.confirm({
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

  API_submitSubmission = () =>
    this.apiStore.request(`collections/${this.id}/submit`, 'PATCH')

  async _fetchSubmissionTest() {
    // if it's a submission we have to look up its test in order to launch
    if (!this.launchableTestId) return false
    const res = await this.apiStore.fetch('collections', this.launchableTestId)
    return res.data
  }

  async _performTestAction(actionName, audiences = null) {
    // possible actions = 'launch', 'close', 'reopen'
    if (!_.includes(['launch', 'close', 'reopen'], actionName)) return false
    let collection = this
    if (this.submission_attrs) {
      collection = await this._fetchSubmissionTest()
    }
    if (_.includes(['launch', 'reopen'], actionName)) {
      if (collection.checkLaunchability()) {
        // called with 'this' so that we know if the submission is calling it
        return this.API_performTestAction(actionName, audiences)
      }
      return false
    }
    // e.g. for close
    return this.API_performTestAction(actionName)
  }

  trackTestAction = actionName => {
    googleTagManager.push({
      event: 'formSubmission',
      formType: `${actionName} Feedback Test`,
    })
  }

  trackAudienceTargeting = audience => {
    googleTagManager.push({
      event: 'formSubmission',
      formType: `Audience targeted with a test`,
      // Do we want more metadata here?
    })
  }

  API_performTestAction = async (actionName, audiences = null) => {
    const { uiStore } = this
    // this will disable any test launch/close/reopen buttons until loading is complete
    uiStore.update('launchButtonLoading', true)

    try {
      const launchedTest = await this.apiStore.request(
        `test_collections/${this.launchableTestId}/${actionName}`,
        'PATCH',
        { audiences }
      )

      if (launchedTest) this.trackTestAction(actionName)

      if (launchedTest && actionName === 'launch' && audiences) {
        audiences.forEach((value, key, _map) => {
          if (value.selected && !value.audience.isLinkSharing)
            this.trackAudienceTargeting(value.audience)
        })
      }
    } catch (e) {
      const errorMessages = e.error.map(e => ` ${e.detail}`)
      let prompt = `You have questions that have not yet been finalized:\n
         ${errorMessages}
        `
      if (_.includes(prompt, 'Test audiences')) {
        prompt = `Test unable to launch:\n
           ${errorMessages}
          `
      }
      // omit the extra wording for close and reopen
      // for reopen: what if there are actually incomplete questions... ?
      if (_.includes(['close', 'reopen'], actionName)) prompt = errorMessages
      uiStore.popupAlert({
        prompt,
        fadeOutTime: 10 * 1000,
      })
      uiStore.update('launchButtonLoading', false)
      return false
    }
    if (_.includes(['launch', 'reopen'], actionName)) {
      // then refetch the cards -- particularly if you just launched
      this.API_fetchCards()
    }
    uiStore.update('launchButtonLoading', false)
    // refetch yourself
    if (this.submission_attrs) this.apiStore.request(`collections/${this.id}`)
    if (this.parent && this.parent.submission_attrs) {
      this.apiStore.request(`collections/${this.parent.id}`)
    }
  }

  API_fetchAllCardIds() {
    return axios.get(`/api/v1/collections/${this.id}/collection_cards/ids`)
  }

  async API_setSubmissionBoxTemplate(data) {
    await this.apiStore.request(
      `collections/set_submission_box_template`,
      'POST',
      data
    )
    // refetch cards because we just created a new one, for the template
    return this.API_fetchCards()
  }

  API_clearCollectionCover() {
    return this.apiStore
      .request(`collections/${this.id}/clear_collection_cover`, 'POST')
      .catch(err => {
        console.warn(err)
        this.uiStore.alert(
          'Unable to change the collection cover. This may be a special collection that you cannot edit.'
        )
      })
  }

  async API_getNextAvailableTest() {
    runInAction(() => {
      this.nextAvailableTestPath = null
    })
    const res = await this.apiStore.request(
      `test_collections/${this.id}/next_available`
    )
    if (!res.data) return
    const path = this.routingStore.pathTo('collections', res.data.id)

    this.setNextAvailableTestPath(`${path}?open=tests`)
  }

  @action
  setNextAvailableTestPath(path) {
    this.nextAvailableTestPath = path
  }
  @action
  updateScrollBottom(y) {
    this.scrollBottom = y
  }

  reassignCover(newCover) {
    const previousCover = this.collection_cards
      .filter(cc => cc !== newCover)
      .find(cc => cc.is_cover === true)
    if (!previousCover) return
    previousCover.is_cover = false
  }

  static async fetchSubmissionsCollection(id, { order } = {}) {
    const res = await apiStore.request(`collections/${id}`)
    const collection = res.data
    collection.API_fetchCards({ order })
    return collection
  }

  async API_sortCards() {
    const order = this.uiStore.collectionCardSortOrder
    this.setReloading(true)
    await this.API_fetchCards({ order })
    this.setReloading(false)
  }

  async API_addComparison(comparisonTest) {
    const apiPath = `test_collections/${this.id}/add_comparison`
    const data = { comparison_collection_id: comparisonTest.id }
    return this.apiStore.request(apiPath, 'POST', { data })
  }

  async API_removeComparison(comparisonTest) {
    const apiPath = `test_collections/${this.id}/remove_comparison`
    const data = { comparison_collection_id: comparisonTest.id }
    return this.apiStore.request(apiPath, 'POST', { data })
  }

  async API_moveCardsIntoCollection({
    toCollection,
    cardIds,
    onCancel,
    onSuccess,
  } = {}) {
    const { uiStore } = this
    const { cardAction } = uiStore
    const can_edit = toCollection.can_edit_content || toCollection.can_edit
    const cancel = () => {
      uiStore.closeMoveMenu()
      uiStore.update('multiMoveCardIds', [])
      uiStore.stopDragging()
      if (_.isFunction(onCancel)) onCancel()
    }
    if (!can_edit) {
      uiStore.confirm({
        prompt:
          'You only have view access to this collection. Would you like to keep moving the cards?',
        confirmText: 'Continue',
        iconName: 'Alert',
        onConfirm: () => {
          cancel()
          uiStore.reselectCardIds(cardIds)
          uiStore.openMoveMenu({
            from: this.id,
            cardAction,
          })
        },
        onCancel: () => {
          cancel()
        },
      })
      return
    }

    if (_.isEmpty(uiStore.multiMoveCardIds)) {
      uiStore.update('multiMoveCardIds', cardIds)
    }
    uiStore.update('movingIntoCollection', toCollection)

    await CardMoveService.moveCards('beginning', {
      to_id: toCollection.id.toString(),
      from_id: this.id.toString(),
      collection_card_ids: cardIds,
    })
    uiStore.update('multiMoveCardIds', [])
    uiStore.update('movingIntoCollection', null)

    // Explicitly remove cards from this collection so front-end updates
    if (cardAction === 'move') {
      this.removeCardIds(cardIds)
    }

    // onSuccess is really "successfully able to edit this collection"
    if (_.isFunction(onSuccess)) onSuccess()
  }

  static async createSubmission(parent_id, submissionSettings) {
    const { routingStore, uiStore } = apiStore
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

  // NOTE: this is only used as a Cypress test method, to simulate card resizing
  API_updateCard({ card, updates, undoMessage } = {}) {
    // this works a little differently than the typical "undo" snapshot...
    // we snapshot the collection_cards.attributes so that they can be reverted
    const jsonData = this.toJsonApiWithCards()
    this.pushUndo({
      snapshot: jsonData.attributes,
      message: undoMessage,
      actionType: POPUP_ACTION_TYPES.SNACKBAR,
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
}

Collection.refDefaults = {
  collection_cards: {
    model: CollectionCard,
    type: ReferenceType.TO_MANY,
    defaultValue: [],
  },
  roles: {
    model: Role,
    type: ReferenceType.TO_MANY,
    defaultValue: [],
  },
  test_audiences: {
    model: TestAudience,
    type: ReferenceType.TO_MANY,
    defaultValue: [],
  },
}

export default Collection
