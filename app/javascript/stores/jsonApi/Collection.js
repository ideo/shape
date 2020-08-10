import _ from 'lodash'
import { observable, computed, action, runInAction } from 'mobx'
import { ReferenceType, updateModelId } from 'datx'
import pluralize from 'pluralize'
import queryString from 'query-string'
import googleTagManager from '~/vendor/googleTagManager'

import { apiUrl, useTemplateInMyCollection } from '~/utils/url'

import {
  calculateRowsCols,
  findTopLeftCard,
} from '~/utils/CollectionGridCalculator'
import BaseRecord from './BaseRecord'
import CardMoveService from '~/utils/CardMoveService'
import CollectionCard from './CollectionCard'
import CollectionFilter from './CollectionFilter'
import Item from './Item'
import Role from './Role'
import TestAudience from './TestAudience'
import SharedRecordMixin from './SharedRecordMixin'
import v, { FOAMCORE_MAX_ZOOM, FOUR_WIDE_MAX_ZOOM } from '~/utils/variables'
import { POPUP_ACTION_TYPES } from '~/enums/actionEnums'
import { methodLibraryTags } from '~/utils/creativeDifferenceVariables'

export const ROW_ACTIONS = {
  INSERT: 'insert_row',
  REMOVE: 'remove_row',
}

class Collection extends SharedRecordMixin(BaseRecord) {
  static type = 'collections'
  static endpoint = apiUrl('collections')

  @observable
  nextAvailableTestPath = null
  @observable
  currentPage = 1
  @observable
  currentOrder = 'order'
  @observable
  totalPages = 1
  recordsPerPage = 50
  searchRecordsPerPage = 20
  @observable
  scrollBottom = 0
  @observable
  storedCacheKey = null
  @observable
  loadedRows = 0
  @observable
  loadedCols = 0
  // store the most recent zoom level of this collection (gets set in uiStore)
  @observable
  lastZoom = null
  @observable
  carouselIdx = 0
  @observable
  viewMode = 'grid'
  // this stores the "virtual" search results collection
  searchResultsCollection = null
  @observable
  phaseSubCollections = []
  @observable
  challengeReviewerGroup = null

  attributesForAPI = [
    'name',
    'tag_list',
    'user_tag_list',
    'submission_template_id',
    'submission_box_type',
    'collection_to_test_id',
    'test_show_media',
    'collection_type',
    'search_term',
    'icon',
    'show_icon_on_cover',
  ]

  constructor(...args) {
    super(...args)
    if (this.isSearchCollection) {
      this.searchResultsCollection = new Collection(
        {
          ...this.rawAttributes(),
          // create as a 4WFC board
          num_columns: 4,
          can_edit_content: false,
          // making up a type
          class_type: 'SearchResultsCollection',
        },
        this.apiStore
      )
      this.searchResultsCollection.collection = this
      updateModelId(this.searchResultsCollection, `${this.id}-searchResults`)
      runInAction(() => {
        this.searchResultsCollection.currentOrder = 'relevance'
      })
    }
  }

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
  setPhaseSubCollections(value) {
    this.phaseSubCollections = value
    return this.phaseSubCollections
  }

  @action
  setCarouselIdx(value) {
    this.carouselIdx = value
  }

  setViewMode(mode) {
    this.uiStore.update('isTransparentLoading', true)
    // this timeout gives the transparentLoader time to appear, because the viewMode change
    // will then cause an immediate re-render which can take your browser a few seconds
    setTimeout(() => {
      runInAction(() => {
        this.viewMode = mode
        this.uiStore.update('isTransparentLoading', false)
      })
    }, 1)
  }

  get currentCarouselRecord() {
    if (_.isEmpty(this.collection_cover_items)) {
      return
    }
    return this.collection_cover_items[this.carouselIdx]
  }

  cardIdsBetween(firstCardId, lastCardId) {
    if (this.isBoard && this.viewMode !== 'list') {
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

  firstCardId(cardIds) {
    const cards = this.collection_cards.filter(card =>
      _.includes(cardIds, card.id)
    )
    let card
    if (this.isBoard) {
      card = findTopLeftCard(cards)
    } else {
      card = _.first(_.sortBy(cards, 'order'))
    }
    if (_.isEmpty(card)) {
      // catch
      return _.first(cardIds)
    }
    return card.id
  }

  get maxColumnIndex() {
    return this.num_columns - 1
  }

  get cardMatrix() {
    if (this.collection_cards.length === 0) return [[]]

    // Get maximum dimensions of our card matrix
    const maxCol = this.maxColumnIndex
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

  get shouldShowEditWarning() {
    if (!this.isTemplate || this.template_num_instances === 0) return false
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

  get isRegularCollection() {
    return this.type === 'Collection'
  }

  get isUserCollection() {
    return this.type === 'Collection::UserCollection'
  }

  get isSharedCollection() {
    return this.type === 'Collection::SharedWithMeCollection'
  }

  get isSearchCollection() {
    return this.type === 'Collection::SearchCollection'
  }

  get isSearchResultsCollection() {
    return this.type === 'SearchResultsCollection'
  }

  get canEdit() {
    // used e.g. by PageHeader
    return this.can_edit_content && !this.system_required
  }

  get canSetACover() {
    return (
      !this.isSharedCollection &&
      !this.isUserCollection &&
      this.cover_type === 'cover_type_default'
    )
  }

  get isSubmissionBox() {
    return this.type === 'Collection::SubmissionBox'
  }

  get isSubmissionsCollection() {
    return this.type === 'Collection::SubmissionsCollection'
  }

  get submissionFormat() {
    if (this.submission_template_id) return 'template'
    if (this.submission_box_type && this.submission_box_type !== 'template')
      return 'item'
    return null
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

  get isSubmissionBoxInsideChallenge() {
    return (
      this.isChallengeOrInsideChallenge &&
      this.isSubmissionBox &&
      this.submission_box_type === 'template'
    )
  }

  get isSubmissionsCollectionInsideChallenge() {
    return (
      this.isChallengeOrInsideChallenge &&
      this.isSubmissionsCollection &&
      this.submission_box_type === 'template'
    )
  }

  get isSubmissionInChallenge() {
    return this.is_inside_a_challenge && this.isSubmission
  }

  get showSubmissionTopicSuggestions() {
    const canEditSubmissionInChallenge =
      this.isSubmissionInChallenge && this.canEdit

    if (!canEditSubmissionInChallenge) return false

    if (!this.parentChallenge) return null

    const hasTopics =
      this.parentChallenge.topic_list &&
      this.parentChallenge.topic_list.length > 0

    return (
      hasTopics &&
      (!this.submission_attrs || !this.submission_attrs.hide_topic_suggestions)
    )
  }

  get isTestCollection() {
    return this.type === 'Collection::TestCollection'
  }

  get isTestResultsCollection() {
    return this.type === 'Collection::TestResultsCollection'
  }

  get isTestCollectionOrResults() {
    return this.isTestCollection || this.isTestResultsCollection
  }

  get isBoard() {
    return this.type === 'Collection::Board' || !!this.num_columns
  }

  get isBigBoard() {
    return this.isBoard && this.num_columns > 4
  }

  get isFourWideBoard() {
    return this.isBoard && this.num_columns === 4
  }

  get maxZoom() {
    return this.isFourWideBoard ? FOUR_WIDE_MAX_ZOOM : FOAMCORE_MAX_ZOOM
  }

  get isPublicJoinable() {
    if (this.apiStore.currentUser) return false
    const anyoneCanJoinParent = _.pick(this, ['parent', 'anyone_can_join'])
    return !!(
      this.anyone_can_join ||
      (this.anyone_can_view && anyoneCanJoinParent)
    )
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

  get countSubmissionLiveTests() {
    if (this.countSubmissions === 0) return 0

    const { submissions_collection } = this
    const liveTests = _.filter(submissions_collection.collection_cards, cc => {
      return cc.record.isLiveTest
    })

    return liveTests ? liveTests.length : 0
  }

  get isTemplate() {
    // returns true for master and subtemplates
    return this.master_template
  }

  get isMasterTemplate() {
    // the meaning of "MasterTemplate" on the frontend is more truly "master" aka "top-level"
    return this.master_template && !this.isSubTemplate
  }

  get isSubTemplate() {
    // a subtemplate is a collection or a template within a template or an instance of it
    return this.is_subtemplate_or_instance
  }

  get isTemplated() {
    return !!this.template_id
  }

  get isUsableTemplate() {
    // you aren't allowed to use the profile template;
    // you also don't use test templates, since duplicating them or
    // creating them within another template is the way to do that
    return (
      this.isMasterTemplate &&
      !this.isProfileTemplate &&
      !this.is_submission_box_template &&
      !this.isTestResultsCollection &&
      !this.isTestCollection
    )
  }

  get launchableTestId() {
    if (this.isTestCollection) {
      return this.id
    } else if (this.isTestResultsCollection) {
      return this.test_collection_id
    } else if (this.submission_attrs) {
      return this.submission_attrs.launchable_test_id
    }
    return undefined
  }

  get isCarousel() {
    return this.cover_type === 'cover_type_carousel'
  }

  get isCreativeDifferenceChartCover() {
    return (
      this.cover_type === 'cover_type_items' &&
      this.collection_cover_items.length > 0 &&
      this.collection_cover_items[0].isData
    )
  }

  @computed
  get launchableTestStatus() {
    if (this.isTestCollectionOrResults) {
      return this.test_status
    }
    if (!this.submission_attrs) return null
    return this.submission_attrs.test_status
  }

  @computed
  get liveTestCollectionId() {
    return this.live_test_collection ? this.live_test_collection.id : null
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
    return this.collection_cards.map(c =>
      _.pick(c, ['id', 'updated_at', 'order', 'row', 'col'])
    )
  }

  get allowsCollectionTypeSelector() {
    return _.every(
      [
        this.isRegularCollection || this.isBoard,
        !this.isSpecialCollection,
        !this.system_required,
      ],
      bool => bool
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

  get numPaidQuestions() {
    if (!this.isTestCollection) return 0

    // TODO: I don't like repeating this here, but in order to calculate this quickly on the front-end
    // it needs to be replicated here and in TestCollectionCardsForSurvey
    const numNonIdeaCards = this.collection_cards.filter(
      card =>
        card.section_type !== 'ideas' &&
        card.card_question_type !== 'question_finish'
    ).length

    let numCardsInIdeasSection = 0
    let numIdeas = 0

    this.collection_cards.forEach(card => {
      if (card.section_type === 'ideas') {
        numCardsInIdeasSection += 1
        if (
          card.card_question_type === 'ideas_collection' &&
          card.record.collection_cards
        ) {
          numIdeas = card.record.collection_cards.length
        }
      }
    })

    // Total number of cards is all in the non-ideas section (they are only shown once),
    // plus the number of cards in the ideas section * number of ideas, as they are repeated for each idea

    return numNonIdeaCards + numCardsInIdeasSection * numIdeas
  }

  get baseName() {
    if (!this.isTestCollection) return this.name
    return _.replace(this.name, ' Feedback Design', '')
  }

  get baseId() {
    return this.id.split('-')[0]
  }

  @action
  addCard(card) {
    if (this.collection_cards.find(cc => cc.id === card.id)) {
      return
    }
    this.collection_cards.unshift(card)
    this._reorderCards()
  }

  @action
  clearCollectionCards() {
    this.collection_cards.replace([])
  }

  toJsonApiWithCards(onlyCardIds = []) {
    const data = this.toJsonApi()
    // attach nested attributes of cards
    if (this.collection_cards) {
      // make sure cards are sequential
      if (!this.isBoard) this._reorderCards()
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

  get isSplitLevel() {
    return this.isSubmissionBox || this.isSearchCollection
  }

  get isSplitLevelBottom() {
    return this.isSubmissionsCollection || this.isSearchResultsCollection
  }

  get showFilters() {
    // these split-level types don't show the filters for the top half
    if (this.isSplitLevel) return false
    return (
      this.isRegularCollection ||
      this.isUserCollection ||
      this.isSubmissionsCollection ||
      this.isBoard
    )
  }

  get activeFilters() {
    let { collection_filters } = this
    if (this.isSearchResultsCollection) {
      collection_filters = this.collection.collection_filters
    } else if (this.isSearchCollection) {
      return []
    }
    return collection_filters.filter(filter => filter.selected)
  }

  API_disableActiveFilters() {
    return Promise.all(
      this.activeFilters.map(filter => {
        return filter.API_toggleSelected(this, false)
      })
    )
  }

  get collectionFilterQuery() {
    const { activeFilters } = this
    if (activeFilters.length === 0) return {}
    const filterQuery = activeFilters.map(filter => {
      if (filter.filter_type === 'tag') {
        return `#${filter.text.split(' ').join('-')}`
      } else if (filter.filter_type === 'user_tag') {
        return `@${filter.text}`
      } else {
        return filter.text
      }
    })

    return { q: filterQuery.join(' ') }
  }

  get isParentMethodLibrary() {
    return (
      this.parent &&
      this.parent.name &&
      this.parent.name.match(/method\s+library/i) !== null
    )
  }

  get isPhaseOrProject() {
    return ['phase', 'project'].includes(this.collection_type)
  }

  @computed
  get filterBarFilters() {
    if (!this.isParentMethodLibrary) return this.collection_filters
    // If it is method library, return all filters except the fixed method library tags
    return this.collection_filters.filter(
      filter =>
        filter.filter_type !== 'tag' ||
        (filter.filter_type === 'tag' &&
          !methodLibraryTags.includes(filter.text.toLowerCase()))
    )
  }

  @computed
  get methodLibraryFilters() {
    return this.collection_filters.filter(
      filter => !this.filterBarFilters.includes(filter)
    )
  }

  get ideasCollection() {
    const card = this.sortedCards.find(
      card => card.card_question_type === 'ideas_collection'
    )
    if (card) return card.record
  }

  async API_fetchCards({
    page = 1,
    per_page = null,
    order,
    hidden = false,
    rows,
    cols,
    searchTerm,
  } = {}) {
    let orderChanged = false
    runInAction(() => {
      if (order && this.currentOrder !== order) {
        orderChanged = true
        this.currentOrder = order
      }
    })
    const params = {
      page,
      per_page,
    }
    if (!params.per_page && !this.isBoard) {
      params.per_page = this.recordsPerPage
    }
    if (this.currentOrder !== 'order') {
      params.card_order = this.currentOrder
    }
    if (hidden) {
      params.hidden = true
    }
    if (this.isBoard && !this.isSplitLevelBottom) {
      // nullify these as they have no effect on boards
      delete params.per_page
      delete params.page
      params.rows = rows || [0, 5]
      if (cols) {
        params.cols = cols
      }
    }
    let apiPath
    if (searchTerm) {
      params.query = searchTerm
      if (this.collectionFilterQuery.q) {
        params.query += ` ${this.collectionFilterQuery.q}`
      }
      params.current_collection_id = this.baseId
      const stringifiedParams = queryString.stringify(params, {
        arrayFormat: 'bracket',
      })
      apiPath = `organizations/${this.organization_id}/search_collection_cards?${stringifiedParams}`
    } else {
      if (params.card_order === 'relevance') {
        // disable "relevance" if there is no search term
        params.card_order = null
      }
      Object.assign(params, this.collectionFilterQuery)
      apiPath = `collections/${
        this.id
      }/collection_cards?${queryString.stringify(params, {
        arrayFormat: 'bracket',
      })}`
    }

    const res = await this.apiStore.request(apiPath)
    const { data, links, meta } = res
    runInAction(() => {
      if (searchTerm) {
        this.totalPages = (meta && meta.total_pages) || 1
      } else {
        this.totalPages = links.last
      }
      const firstPage = page === 1 && (!rows || rows[0] === 0)
      if (
        firstPage &&
        (this.storedCacheKey !== this.cache_key ||
          data.length === 0 ||
          searchTerm ||
          orderChanged)
      ) {
        this.storedCacheKey = this.cache_key
        this.collection_cards.replace(data)
        this.currentPage = 1
        if (this.isBoard) {
          // reset these to be recalculated in updateMaxLoaded
          this.loadedRows = 0
          this.loadedCols = 0
        }
      } else {
        if (this.currentPage < page) {
          this.currentPage = page
        }
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

      if (this.isSplitLevelBottom) {
        this.calculateRowsCols()
      }

      if (this.isBoard && params.rows) {
        this.updateMaxLoadedColsRows({ maxRow: params.rows[1] })
      }
    })
    return data
  }

  @action
  calculateRowsCols() {
    // EXPERIMENT: apply rows/cols so that we can render search results as a FoamcoreGrid
    calculateRowsCols(this.collection_cards, {
      sortByOrder: false,
      apply: true,
      // submissionsCollection needs to make room for "AddSubmission" at 0,0
      prefilled: this.isSubmissionsCollection ? 1 : 0,
    })
    const maxRow = (_.maxBy(this.collection_cards, 'row') || { row: 0 }).row
    // this value is simulated
    this.max_row_index = maxRow
    this.updateMaxLoadedColsRows({ maxRow })
  }

  API_fetchCard = async cardId => {
    const { apiStore } = this
    const res = await apiStore.fetch('collection_cards', cardId, true)
    // make sure it's in our current collection
    const card = res.data
    this.addCard(card)
    return card
  }

  @action
  mergeCards = cards => {
    // de-dupe merged data (deferring to new cards first)
    const newData = _.unionBy(cards, this.collection_cards, 'id')
    this.collection_cards.replace(_.sortBy(newData, 'order'))
  }

  API_fetchCardOrders = async () => {
    const cardOrders = await this.API_fetchAllCardIds()
    runInAction(() => {
      _.each(cardOrders, orderData => {
        const card = this.collection_cards.find(cc => cc.id === orderData.id)
        if (card) {
          card.order = orderData.order
        }
      })
      this.collection_cards.replace(_.sortBy(this.collection_cards, 'order'))
    })
  }

  API_fetchCardRoles = () => {
    const ids = _.compact(
      _.map(this.collection_cards, cc => {
        if (cc.record && _.isEmpty(cc.record.roles)) {
          return cc.id
        }
      })
    )
    if (ids.length === 0) return
    return this.apiStore.request(
      `collections/${this.id}/collection_cards/roles?select_ids=${ids}`
    )
  }

  API_fetchCardReviewerStatuses = async () => {
    const ids = _.compact(
      _.map(this.collection_cards, cc => {
        if (
          cc.record &&
          !_.isEmpty(cc.record.user_tag_list) &&
          _.isEmpty(cc.record.reviewerStatuses)
        ) {
          return cc.id
        }
      })
    )
    if (ids.length === 0) return
    const statuses = await this.apiStore.requestJson(
      `collections/${this.id}/collection_cards/reviewer_statuses?select_ids=${ids}`
    )
    const statusesByRecord = _.groupBy(statuses, 'record_id')
    _.each(statusesByRecord, (recordStatuses, record_id) => {
      const record = this.apiStore.find('collections', record_id.toString())
      if (record) {
        runInAction(() => {
          record.reviewerStatuses = recordStatuses
        })
      }
    })
    return statuses
  }

  async API_fetchAndMergeCards(cardIds) {
    const { apiStore } = this
    const ids = cardIds.join(',')
    const res = await apiStore.request(
      `collections/${this.id}/collection_cards?select_ids=${ids}`
    )
    const cards = res.data
    runInAction(() => {
      this.mergeCards(cards)
      if (!this.isBoard) {
        this.API_fetchCardOrders()
      }
    })
    return cards
  }

  @action
  updateMaxLoadedColsRows = ({ maxRow } = {}) => {
    const maxCol = (_.maxBy(this.collection_cards, 'col') || { col: 0 }).col
    if (maxRow > this.loadedRows) {
      this.loadedRows = maxRow
    }
    if (maxCol > this.loadedCols) {
      this.loadedCols = maxCol
    }
  }

  API_fetchBreadcrumbRecords() {
    const apiPath = `collections/${this.id}/collection_cards/breadcrumb_records`
    return this.apiStore.request(apiPath)
  }

  // This is to fetch the phases that are displayed in the header for a challenge
  API_fetchChallengePhaseCollections() {
    const apiPath = `collections/${this.id}/challenge_phase_collections`
    return this.apiStore.request(apiPath)
  }

  // Fetch all children submission boxes of this collection
  API_fetchSubmissionBoxSubCollections() {
    const apiPath = `collections/${this.id}/challenge_submission_boxes`
    return this.apiStore.request(apiPath)
  }

  // Fetch all children phase collections of this collection
  API_fetchPhaseSubCollections() {
    const apiPath = `collections/${this.id}/phase_sub_collections`
    return this.apiStore.request(apiPath)
  }

  API_hideSubmissionTopicSuggestions() {
    if (!this.submission_attrs) return false
    this.submission_attrs.hide_topic_suggestions = true
    this.save()
  }

  async loadPhaseSubCollections() {
    const request = await this.API_fetchPhaseSubCollections()
    return request.data
  }

  async createChildPhaseCollection(name) {
    const attrs = {
      collection_attributes: {
        name,
        collection_type: 'phase',
      },
      parent_id: this.id,
    }
    const card = new CollectionCard(attrs, this.apiStore)
    card.parent = this
    // TODO: add error handling
    const savedCard = await card.API_create()
    return savedCard.record
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
    const performUpdate = async () => {
      const { uiStore } = this
      // close MoveMenu if you were dragging from MDL
      if (uiStore.draggingFromMDL) uiStore.closeMoveMenu()

      const updatesByCardId = {}
      _.each(updates, update => {
        updatesByCardId[update.card.id] = update
      })
      const cardIds = _.keys(updatesByCardId)

      // Store snapshot of existing cards so changes can be un-done
      const dataBeforeMove = this.toJsonApiWithCards(
        updateAllCards ? [] : cardIds
      )
      const snapshot = dataBeforeMove.attributes
      this.applyLocalCardUpdates(updates)
      // now get current data after making the updates
      const data = this.toJsonApiWithCards(updateAllCards ? [] : cardIds)

      try {
        // Persist updates to API
        const res = await this.apiStore.request(
          `collections/${this.id}`,
          'PATCH',
          { data }
        )
        // do this again... this is because you may have received a RT update in between;
        // but your update is now "the latest"
        this.applyLocalCardUpdates(updates)
        this._reorderCards()

        if (res) {
          // only push undo once we've successfully updated the cards
          this.pushUndo({
            snapshot,
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
          if (onConfirm) onConfirm()
        }
      } catch {
        this.uiStore.popupSnackbar({ message: 'Move cancelled due to overlap' })
        this.revertToSnapshot(snapshot)
        if (onCancel) onCancel()
      }
    }

    // Show a dialog if in a template
    return this.confirmEdit({
      onCancel,
      onConfirm: performUpdate,
    })
  }

  applyRemoteUpdates(params) {
    if (params.collection_cards_attributes) {
      // apply collection_cards_attributes
      this.revertToSnapshot(params)
    }
  }

  revertToSnapshot(snapshot) {
    const updates = []
    if (!snapshot || !snapshot.collection_cards_attributes) {
      return
    }
    snapshot.collection_cards_attributes.forEach(cardData => {
      const update = _.pick(cardData, [
        'order',
        'width',
        'height',
        'row',
        'col',
      ])
      update.card = { id: cardData.id }
      updates.push(update)
    })
    this.applyLocalCardUpdates(updates)
  }

  @action
  applyLocalCardUpdates(updates) {
    const updatesByCardId = {}
    _.each(updates, update => {
      updatesByCardId[update.card.id] = update
    })
    const orders = _.map(updates, update => update.order)
    const minOrder = _.min(orders)
    const maxOrder = _.max(orders)
    // min...max is range of cards you are moving
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
      } else if (card.order >= minOrder) {
        // make sure this card gets bumped out of the way of our moving ones
        card.order += maxOrder + 1
      }
      // force the grid to immediately observe that things have changed
      card.updated_at = new Date()
    })
  }

  API_createCollectionFilter(params) {
    return this.apiStore.request(
      `collections/${this.id}/collection_filters/`,
      'POST',
      {
        ...params,
      }
    )
  }

  API_destroyCollectionFilter(filter) {
    return this.apiStore.request(
      `collections/${this.id}/collection_filters/${filter.id}`,
      'DELETE'
    )
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
    let orderList = ['pinned', 'order']
    let order = ['desc', 'asc']
    if (this.currentOrder !== 'order') {
      orderList = [this.currentOrder]
      order = ['desc']
    }
    if (this.isBoard) {
      orderList = ['row', 'col']
      order = ['asc', 'asc']
    }
    return _.orderBy(this.collection_cards, orderList, order)
  }

  @computed
  get sortedCoverCards() {
    const filteredCards = _.filter(
      this.collection_cards,
      card =>
        card.record.isImage &&
        (!card.section_type || card.section_type === 'cover')
    )
    return _.orderBy(
      filteredCards,
      // hidden is actually shown first for these to better surface uploaded covers
      ['hidden', 'order', 'row', 'col', 'updated_at'],
      ['desc', 'asc', 'asc', 'asc', 'desc']
    )
  }

  @computed
  get sortedBackgroundCards() {
    const filteredCards = _.filter(
      this.collection_cards,
      card => card.section_type === 'background'
    )
    return _.orderBy(filteredCards, ['order', 'updated_at'], ['asc', 'desc'])
  }

  get isChallengeOrInsideChallenge() {
    return this.collection_type === 'challenge' || this.is_inside_a_challenge
  }

  get currentReviewerHandles() {
    if (!this.isSubmissionInChallenge) return []
    return _.get(this, 'user_tag_list', [])
  }

  get canBeReviewedByCurrentUser() {
    if (!this.isSubmissionInChallenge || !this.isLiveTest) {
      return false
    }

    return this.can_review
  }

  // TODO: deprecate once we fully migrate 4WFC
  @action
  _reorderCards() {
    // NOTE: this should work ok even if there are infinite scroll / pagination cards
    // not being displayed offscreen...
    if (this.collection_cards) {
      _.each(this.sortedCards, (card, i) => {
        if (this.isBoard) {
          card.order = 0
        } else {
          card.order = i
        }
      })
    }
  }

  checkLaunchability() {
    if (!this.can_edit_content || !this.launchable) {
      // TODO: More specific messaging around why e.g. if this is a submission template...
      let message =
        'You must close any other live tests before launching this one.'
      if (this.is_inside_a_submission) {
        message = 'Only editors are allowed to launch the test.'
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
    if (
      _.includes(['launch', 'reopen'], actionName) &&
      collection.checkLaunchability()
    ) {
      // called with 'this' so that we know if the submission is calling it
      await this.API_performTestAction(actionName, audiences)
      // launching a submission box test will not have a test_results_collection
      if (actionName === 'launch' && collection.test_results_collection) {
        this.routingStore.routeTo(
          'collections',
          collection.test_results_collection.id
        )
      }
    } else if (actionName === 'close') {
      // e.g. for close
      return this.API_performTestAction(actionName)
    }
  }

  trackTestAction = ({
    actionName,
    hasLinkSharingAudience = false,
    hasPaidAudience = false,
    ideasCount = 0,
  }) => {
    googleTagManager.push({
      event: 'formSubmission',
      formType: `${actionName} Feedback Test`,
      timestamp: new Date().toUTCString(),
      testId: this.launchableTestId,
      hasLinkSharingAudience,
      hasPaidAudience,
      ideasCount,
    })
  }

  trackAudienceTargeting = audience => {
    googleTagManager.push({
      event: 'formSubmission',
      formType: `Audience targeted with a test`,
      // Do we want more metadata here?
    })
  }

  openLaunchValidationDialog = (apiError, actionName = 'launch') => {
    const { uiStore } = this
    const errors = apiError.error
    let intro = `Test unable to ${actionName}:`
    // look for the invalid questions error case
    const invalidQuestions = _.remove(errors, {
      title: 'Invalid question_items',
    })
    if (invalidQuestions.length) {
      intro = 'You have questions that have not yet been finalized:'
    }
    const errorMessages = errors.map(e => ` ${e.detail}`).toString()
    const prompt = `${intro}\n${errorMessages}`

    uiStore.popupAlert({
      prompt,
      maxWidth: 'sm',
      fadeOutTime: 10 * 1000,
    })
  }

  API_validateLaunch = async () => {
    const { apiStore, uiStore } = this
    if (!this.launchableTestId) return false
    uiStore.update('launchButtonLoading', true)
    try {
      await apiStore.request(
        `test_collections/${this.launchableTestId}/validate_launch`
      )
      uiStore.update('launchButtonLoading', false)
      return true
    } catch (err) {
      this.openLaunchValidationDialog(err)
      uiStore.update('launchButtonLoading', false)
      return false
    }
  }

  API_performTestAction = async (actionName, audiences = null) => {
    const { uiStore } = this
    // this will disable any test launch/close/reopen buttons until loading is complete
    uiStore.update('launchButtonLoading', true)

    try {
      const selectedAudiences = {}
      if (audiences) {
        audiences.forEach((value, key) => {
          if (value.selected) {
            selectedAudiences[key] = value
          }
        })
      }
      const launchedTest = await this.apiStore.request(
        `test_collections/${this.launchableTestId}/${actionName}`,
        'PATCH',
        { audiences: selectedAudiences }
      )

      if (launchedTest && actionName === 'launch' && audiences) {
        _.each(selectedAudiences, (value, key) => {
          if (!value.audience.isLinkSharing) {
            this.trackAudienceTargeting(value.audience)
          }
        })
      }
      const { has_link_sharing, gives_incentive } = this
      const ideasCount = _.get(this, 'ideasCollection.collection_card_count', 0)
      if (launchedTest) {
        this.trackTestAction({
          actionName,
          hasLinkSharingAudience: has_link_sharing,
          hasPaidAudience: gives_incentive,
          ideasCount,
        })
      }
    } catch (err) {
      this.openLaunchValidationDialog(err, actionName)
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
    return this.apiStore.requestJson(
      `collections/${this.id}/collection_cards/ids`
    )
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

  API_backgroundUpdateTemplateInstances({ type = null, ids = [] }) {
    if (!type || _.isEmpty(ids)) return

    const data = { type, ids }

    return this.apiStore.request(
      `collections/${this.id}/background_update_template_instances`,
      'POST',
      data
    )
  }

  API_backgroundUpdateLiveTest(collection_card_id) {
    const { apiStore } = this
    const { currentUser } = apiStore
    return apiStore.request(
      `collections/${this.id}/background_update_live_test`,
      'POST',
      { collection_card_id, created_by_id: currentUser.id }
    )
  }

  async API_collectionChallengeSetup() {
    const {
      challenge_admin_group_id,
      challenge_reviewer_group_id,
      challenge_participant_group_id,
    } = this
    if (
      challenge_admin_group_id &&
      challenge_reviewer_group_id &&
      challenge_participant_group_id
    ) {
      return
    }

    const { apiStore } = this
    const res = await apiStore.request(
      `collections/${this.id}/collection_challenge_setup`,
      'POST'
    )
    // need to set parentChallenge as "this"
    this.initializeParentChallengeForCollection()
    return res
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

  API_clearBackgroundImage() {
    this.background_image_url = null
    return this.apiStore.request(
      `collections/${this.id}/clear_background_image`,
      'POST'
    )
  }

  @computed
  get potentialReviewers() {
    if (!this.parentChallenge || !this.isSubmissionsCollection) return []
    const reviewerGroupRoles = _.get(
      this.parentChallenge,
      'challenge_reviewer_group.roles'
    )

    if (_.isEmpty(reviewerGroupRoles)) return []

    const potentialReviewerList = []
    _.each(reviewerGroupRoles, role => {
      const users = _.get(role, 'users', [])
      _.each(users, user => {
        if (!_.includes(potentialReviewerList, user)) {
          potentialReviewerList.push(user)
        }
      })
    })
    return potentialReviewerList
  }

  async API_getNextAvailableTest() {
    this.setNextAvailableTestPath(null)
    const res = await this.apiStore.request(
      `collections/${this.id}/next_available_submission_test`
    )
    const { data: nextTest } = res
    if (!nextTest) return

    let path = this.routingStore.pathTo('tests', nextTest.id)
    if (nextTest.collection_to_test_id) {
      path = this.routingStore.pathTo(
        'collections',
        nextTest.collection_to_test_id
      )
      path += `?open=tests`
    }

    this.setNextAvailableTestPath(path)
    return path
  }

  navigateToTest() {
    window.location.href = this.publicTestURL
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

  // Load phase collections for given submission box collections
  async loadPhasesForSubmissionBoxes(submissionBoxes) {
    // Filter out any that don't have a submission template (can't assign phases)
    // Or any that have phase sub-collections already loaded
    const subBoxesWithTemplates = submissionBoxes.filter(
      subBox =>
        !!subBox.submission_template && subBox.phaseSubCollections.length === 0
    )
    // Get phase collections for each submission box's template
    const loadPhases = subBoxesWithTemplates.map(subBox => {
      return new Promise(resolve => {
        resolve(subBox.submission_template.loadPhaseSubCollections())
      }).then(phaseSubCollections => {
        // Set phase collections directly on each submission box
        subBox.setPhaseSubCollections(phaseSubCollections)
      })
    })
    await Promise.all(loadPhases)
    return submissionBoxes
  }

  async fetchSubmissionsCollection({ order } = {}) {
    const { apiStore, submissions_collection_id } = this
    const res = await apiStore.request(
      `collections/${submissions_collection_id}`
    )
    const submissions_collection = res.data
    // set the reverse relationship
    submissions_collection.submission_box = this
    await submissions_collection.API_fetchCards({ order })
    return submissions_collection
  }

  @action
  async API_sortCards() {
    const { uiStore } = this
    const order = uiStore.collectionCardSortOrder
    // don't do full loading which will blank out the whole page
    const loading = 'isTransparentLoading'
    uiStore.update(loading, true)
    await this.API_fetchCards({ order })
    uiStore.update(loading, false)
  }

  async API_updateComparison(comparisonTest, action) {
    let { id } = this
    let test_results_collection_id = null
    if (this.isTestResultsCollection) {
      id = this.test_collection_id
      test_results_collection_id = this.id
    }
    const apiPath = `test_collections/${id}/${action}_comparison`
    const data = {
      comparison_collection_id: comparisonTest.id,
      test_results_collection_id,
    }
    return this.apiStore.request(apiPath, 'POST', { data })
  }

  API_addComparison(comparisonTest) {
    return this.API_updateComparison(comparisonTest, 'add')
  }

  API_removeComparison(comparisonTest) {
    return this.API_updateComparison(comparisonTest, 'remove')
  }

  async API_selectCollectionType(collectionType) {
    const apiPath = `collections/${this.id}`
    const data = {
      type: 'collections',
      attributes: {
        collection_type: collectionType,
      },
    }
    return this.apiStore.request(apiPath, 'PATCH', { data })
  }

  @action
  async API_moveCardsIntoCollection({
    toCollection,
    cardIds,
    onCancel,
    onSuccess,
  } = {}) {
    const { uiStore } = this
    const { cardAction } = uiStore
    // ensure it is a normal array
    const cardIds_arr = [...cardIds]
    const movingFromCollectionId = uiStore.movingFromCollectionId || this.id
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
          uiStore.reselectCardIds(cardIds_arr)
          uiStore.openMoveMenu({
            from: this,
            cardAction,
          })
        },
        onCancel: () => {
          cancel()
        },
      })
      return
    }

    uiStore.setMovingIntoCollection(toCollection)

    const success = await CardMoveService.moveCards('beginning', {
      to_id: toCollection.id.toString(),
      from_id: movingFromCollectionId,
      collection_card_ids: cardIds_arr,
    })
    if (!success) return false

    // Explicitly remove cards from this collection so front-end updates
    if (cardAction === 'move' && movingFromCollectionId === this.id) {
      this.removeCardIds(cardIds_arr)
    }

    // onSuccess is really "successfully able to edit this collection"
    if (_.isFunction(onSuccess)) onSuccess()
  }

  // find all data cards in the collection and refetch
  // e.g. when adding a new LegendItem comparison
  reloadDataItemsDatasets() {
    _.each(this.collection_cards, card => {
      let { record } = card
      const { coverItem } = record
      if (coverItem && coverItem.isData) {
        record = coverItem
      }
      if (record.isData) {
        record.API_fetchDatasets()
      }
    })
  }

  get subtitle() {
    const { cover } = this
    if (cover.subtitle_hidden) {
      return ''
    }
    return cover.hardcoded_subtitle || cover.text || ''
  }

  get subtitleForEditing() {
    const { cover } = this
    return cover.hardcoded_subtitle || cover.text || ''
  }

  get subtitleHidden() {
    const { cover } = this
    return cover && cover.subtitle_hidden ? true : false
  }

  get coverItem() {
    const { collection_cover_items } = this
    if (!collection_cover_items || collection_cover_items.length === 0)
      return null
    return collection_cover_items[0]
  }

  get reviewableCards() {
    if (!this.isSubmissionsCollection) return []
    return _.filter(this.collection_cards, cc => {
      return _.get(cc, 'record.isLiveTest')
    })
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

    // this will also reorder the cards
    const data = this.toJsonApiWithCards()
    // we don't want to receive updates which are just going to try to re-render
    data.cancel_sync = true
    const apiPath = `collections/${this.id}`
    return this.apiStore.request(apiPath, 'PATCH', { data })
  }

  async API_manipulateRow({ row, action, pushUndo = true } = {}) {
    const { apiStore, uiStore } = this
    const params = {
      row,
    }
    let oppositeAction = ROW_ACTIONS.REMOVE
    let actionMessage = 'Insert row'
    if (action === ROW_ACTIONS.REMOVE) {
      oppositeAction = ROW_ACTIONS.INSERT
      actionMessage = 'Remove row'
    }

    try {
      uiStore.update('isTransparentLoading', true)
      await apiStore.request(`collections/${this.id}/${action}`, 'POST', params)
      this.applyRowUpdate({ row, action })
      uiStore.update('isTransparentLoading', false)

      if (!pushUndo) {
        return
      }
      this.pushUndo({
        apiCall: () => {
          this.API_manipulateRow({
            row,
            action: oppositeAction,
            pushUndo: false,
          })
        },
        message: `${actionMessage} undone`,
        redoAction: {
          message: `${actionMessage} redone`,
          apiCall: () =>
            // re-call the same function
            this.API_manipulateRow({ row, action }),
        },
      })
    } catch (e) {
      console.warn(e)
      uiStore.defaultAlertError()
    }
  }

  @action
  applyRowUpdate({ row, action }) {
    // by making this an action it will cause one re-render instead of many
    if (action === ROW_ACTIONS.REMOVE) {
      this.max_row_index -= 1
    } else {
      this.max_row_index += 1
    }
    this.collection_cards.forEach(card => {
      const shift = action === ROW_ACTIONS.REMOVE ? -1 : 1
      if (card.row > row) {
        card.row += shift
      }
    })
  }

  toggleTemplateHelper() {
    const { apiStore } = this
    const { currentUser } = apiStore
    const { show_template_helper, use_template_setting } = currentUser
    const { letMePlaceIt, addToMyCollection } = v.useTemplateSettings

    if (
      !show_template_helper &&
      (!use_template_setting || use_template_setting === letMePlaceIt)
    ) {
      this.uiStore.openMoveMenu({
        from: this,
        cardAction: 'useTemplate',
      })
    } else if (
      !show_template_helper &&
      use_template_setting === addToMyCollection
    ) {
      return useTemplateInMyCollection(this.id)
    } else {
      this.uiStore.closeMoveMenu()
      this.uiStore.update('showTemplateHelperForCollection', this)
      this.uiStore.update('templateName', this.name)
    }
  }

  get backgroundImageUrl() {
    return _.get(this, 'collection_style.background_image_url')
  }

  get fontColor() {
    return _.get(this, 'collection_style.font_color')
  }

  get styledTheme() {
    const { fontColor } = this
    const theme = {
      // can probably deprecate this once we fully migrate 4WFC?
      useResponsiveText: !this.isBoard,
    }
    if (fontColor) {
      theme.fontColor = fontColor
    }
    return theme
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
  collection_filters: {
    model: CollectionFilter,
    type: ReferenceType.TO_MANY,
    defaultValue: [],
  },
  collection_cover_items: {
    model: Item,
    type: ReferenceType.TO_MANY,
    defaultValue: [],
  },
  collection_cover_text_items: {
    model: Item,
    type: ReferenceType.TO_MANY,
    defaultValue: [],
  },
}

export default Collection
