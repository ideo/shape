import _ from 'lodash'
import { observable } from 'mobx'

const fakeJsonApiAttrs = {
  assign: jest.fn(),
  assignRef: jest.fn(),
  save: jest.fn().mockReturnValue(Promise.resolve({})),
  create: jest.fn().mockReturnValue(Promise.resolve({})),
  patch: jest.fn().mockReturnValue(Promise.resolve({})),
  update: jest.fn().mockReturnValue(Promise.resolve({})),
  disableMenu: jest.fn(),
}
export const fakeCollectionCard = {
  id: '11',
  order: 1,
  height: 1,
  width: 1,
  row: 0,
  col: 1,
  maxWidth: 1,
  maxHeight: 1,
  record: {},
  item: {},
  reference: false,
  image_contain: false,
  section_type: null,
  beginReplacing: jest.fn(),
  API_create: jest.fn(),
  API_archive: jest.fn(),
  API_linkToMyCollection: jest.fn(),
  API_updateCardFilter: jest.fn(),
  ...fakeJsonApiAttrs,
}

export const fakeQuillOp = { insert: 'hello world \n' }
export const fakeQuillData = { ops: [fakeQuillOp] }

export const fakeTextItemAttrs = {
  id: '1',
  type: 'Item::TextItem',
  internalType: 'items',
  name: 'My Cool Item',
  can_view: true,
  quill_data: fakeQuillData,
  breadcrumb: [['collections', 1, 'Some collection'], ['items', 1, 'my item']],
  parentPath: '/',
  can_edit: false,
  inherited_tag_list: [],
  internalType: 'items',
  fullyLoaded: true,
  parent_collection_card: { ...fakeCollectionCard },
  API_fetchDatasets: jest.fn().mockReturnValue(Promise.resolve({})),
  roles: [],

}

const areaChartData = [
  { date: '2018-07-10', value: 10, percentage: 10 },
  { date: '2018-08-10', value: 25, percentage: 25 },
  { date: '2018-09-10', value: 30, percentage: 30 },
]

export const fakeAreaChartDataset = {
  identifier: 'question',
  measure: 'participants',
  description: 'A description',
  timeframe: 'month',
  chart_type: 'area',
  order: 0,
  tiers: [],
  data: areaChartData,
  dataWithDates: areaChartData.map(d => ({
    date: new Date(d.date),
    value: d.value,
  })),
}

export const fakeCDChartDataset = (data, overrides) => ({
  ...fakeAreaChartDataset,
  dataWithDates: data.map(d => ({
    date: new Date(d.date),
    value: d.value,
  })),
  chart_type: 'area',
  measure: 'Passion',
  name: 'IDEO Products',
  style: {fill: "#7e5396"},
  order: overrides.order || 0,
})

const fakeBarChartData = [
  { column: 1, value: 5, percentage: 50, type: 'question_context' },
  { column: 2, value: 0, percentage: 0, type: 'question_context' },
  { column: 3, value: 5, percentage: 50, type: 'question_context' },
  { column: 4, value: 0, percentage: 0, type: 'question_context' },
]

export const fakeBarChartDataset = {
  identifier: 'question',
  measure: 'participants',
  description: 'A description',
  question_type: 'question_context',
  timeframe: 'month',
  chart_type: 'bar',
  order: 0,
  total: 10,
  max_domain: 95,
  tiers: [],
  data: fakeBarChartData,
  dataWithDates: fakeBarChartData,
  isEmojiOrScaleQuestion: jest.fn(),
}

export const fakeDataItemCollectionsItemsAttrs = {
  ...fakeTextItemAttrs,
  type: 'Item::DataItem',
  quill_data: null,
  report_type: 'report_type_collections_and_items',
  isReportTypeCollectionsItems: true,
  isReportTypeNetworkAppMetric: false,
  isReportTypeRecord: false,
  data_settings: {
    d_measure: 'participants',
    d_timeframe: 'month',
  },
  measure: {
    name: 'Participants',
  },
  primaryDataset: fakeAreaChartDataset,
  datasets: [fakeAreaChartDataset],
}

const creativeDifferenceData = [
  { date: '2018-07-10', value: 10 },
  { date: '2018-08-10', value: 25 },
  { date: '2018-09-10', value: 30 },
]

export const creativeDifferenceQualityDataset = {
  name: 'purpose',
  identifier: 'purpose',
  measure: 'Purpose',
  description:
    'The degree to which there is alignment about a meaningful change that leadership and employees want to make in the world.',
  timeframe: 'month',
  chart_type: 'area',
  single_value: 0,
  order: 0,
  style: {
    fill: '#EFEFEF',
    dashWidth: 2,
  },
  max_domain: 60,
  tiers: [
    { value: 0, name: 'Novice' },
    { value: 20, name: 'Learning' },
    { value: 40, name: 'Expert' },
  ],
  data: creativeDifferenceData,
  dataWithDates: creativeDifferenceData,
}

export const fakeDatasetAttrs = {
  chart_type: 'bar',
  data: [],
  data_items_datasets_id: 100,
  measure: 'participants',
  identifier: 'dataset',
  name: 'dataset',
  order: 0,
  question_type: null,
  selected: true,
  single_value: 32,
  test_collection_id: null,
  timeframe: 'ever',
  total: 1,
  tiers: [],
}

export const fakeDataset = {
  ...fakeDatasetAttrs,
  rawAttributes: jest.fn().mockReturnValue(fakeDatasetAttrs),
  getRecordType: jest.fn().mockReturnValue('datasets'),
  toJSON: jest.fn().mockReturnValue(fakeDatasetAttrs),
  ...fakeJsonApiAttrs,
}

export const fakeDataItemRecordAttrs = {
  ...fakeTextItemAttrs,
  type: 'Item::DataItem',
  quill_data: null,
  datasets: [fakeDataset],
  name: 'Data Item',
  report_type: 'report_type_record',
  isReportTypeCollectionsItems: false,
  isReportTypeNetworkAppMetric: false,
  isReportTypeRecord: true,
  primaryDataset: creativeDifferenceQualityDataset,
  datasets: [
    creativeDifferenceQualityDataset,
    {
      ...creativeDifferenceQualityDataset,
      measure: '95th Percentile',
      order: 1,
      chart_type: 'line',
    },
  ],
  primaryDataset: jest.fn(),
  secondaryDatasets: jest.fn(),
}

export const fakeDataItem = {
  ...fakeDataItemRecordAttrs,
  rawAttributes: jest.fn().mockReturnValue(fakeDataItemRecordAttrs),
  getRecordType: jest.fn().mockReturnValue('items'),
  toJSON: jest.fn().mockReturnValue(fakeDataItemRecordAttrs),
  ...fakeJsonApiAttrs,
}

export const fakeLegendItemAttrs = {
  ...fakeTextItemAttrs,
  type: 'Item::LegendItem',
  primary_measure: {
    measure: 'Business Unit',
    order: 0,
    style: { fill: '#9874AB' },
  },
  legend_search_source: 'search_test_collections',
  primaryDataset: fakeDataset,
  datasets: [
    fakeDataset,
    {
      order: 1,
      measure: '95th Percentile',
      name: '85th',
      fakeDataset,
      selected: true,
    },
    {
      order: 2,
      measure: '75th Percentile',
      name: '75th',
      fakeDataset,
      selected: true,
    },
  ],
}

export const fakeLegendItem = {
  ...fakeLegendItemAttrs,
  rawAttributes: jest.fn().mockReturnValue(fakeLegendItemAttrs),
  getRecordType: jest.fn().mockReturnValue('items'),
  save: jest.fn().mockReturnValue(Promise.resolve({})),
}

export const fakeLegendItemCard = {
  ...fakeItemCard,
  record: fakeLegendItem,
  parent: fakeCollection,
}

export const fakeTextItem = {
  ...fakeTextItemAttrs,
  rawAttributes: jest.fn().mockReturnValue(fakeTextItemAttrs),
  getRecordType: jest.fn().mockReturnValue('items'),
  toJSON: jest.fn().mockReturnValue(fakeTextItemAttrs),
  pushUndo: jest.fn(),
  pushTextUndo: jest.fn(),
  setCollaborators: jest.fn(),
  collaborators: [],
  roles: [],
  version: 1,
  ...fakeJsonApiAttrs,
}
export const fakeVideoItemAttrs = {
  id: '2',
  type: 'Item::VideoItem',
  internalType: 'items',
  name: 'Crazy Honey Badger',
  url: 'https://www.youtube.com/watch?v=4r7wHMg5Yjg',
  thumbnail_url: 'https://img.youtube.com/vi/4r7wHMg5Yjg/hqdefault.jpg',
  inherited_tag_list: [],
  can_edit: false,
  parent_collection_card: fakeCollectionCard,
}
export const fakeVideoItem = {
  ...fakeVideoItemAttrs,
  rawAttributes: jest.fn().mockReturnValue(fakeTextItemAttrs),
  getRecordType: jest.fn().mockReturnValue('items'),
}
export const fakeImageItemAttrs = {
  id: '3',
  type: 'Item::FileItem',
  name: 'Earth from Space',
  filestack_file: {
    id: '1',
    url:
      'https://www.nasa.gov/sites/default/files/styles/full_width_feature/public/thumbnails/image/iss052e023801_0.jpg',
  },
  imageUrl: jest.fn(),
  inherited_tag_list: [],
  can_edit: false,
  parent_collection_card: fakeCollectionCard,
}
export const fakeImageItem = {
  ...fakeImageItemAttrs,
  imageUrl: jest.fn().mockReturnValue('http://fake.url/img'),
  rawAttributes: jest.fn().mockReturnValue(fakeTextItemAttrs),
  getRecordType: jest.fn().mockReturnValue('items'),
}
export const fakeLinkItemAttrs = {
  id: '3',
  internalType: 'items',
  type: 'Item::LinkItem',
  name: 'Independent.uk',
  content: 'The best news under the sun',
  icon_url: 'http://icon.jpg',
  thumbnail_url: 'http://thumb.jpg',
  url: 'http://independente.co.uk',
  inherited_tag_list: [],
  can_edit: false,
  parent_collection_card: fakeCollectionCard,
}
export const fakeLinkItem = {
  ...fakeLinkItemAttrs,
  rawAttributes: jest.fn().mockReturnValue(fakeLinkItemAttrs),
  getRecordType: jest.fn().mockReturnValue('items'),
}
export const fakeFileItemAttrs = {
  id: '3',
  type: 'Item::FileItem',
  name: '',
  filestack_file: {
    id: '1',
    url:
      'https://www.nasa.gov/sites/default/files/styles/full_width_feature/public/thumbnails/image/iss052e023801_0.ppt',
    handle: 'aaaaaa',
    mimetype: 'application/vnd.powerpoint',
  },
  inherited_tag_list: [],
  can_edit: false,
  can_view: true,
  parent_collection_card: fakeCollectionCard,
}
export const fakeFileItem = {
  ...fakeFileItemAttrs,
  rawAttributes: jest.fn().mockReturnValue(fakeTextItemAttrs),
  getRecordType: jest.fn().mockReturnValue('items'),
}
export const fakeQuestionItem = {
  id: '3',
  // ...fakeTextItemAttrs,
  type: 'Item::QuestionItem',
  question_type: 'question_open',
  isSingleChoiceQuestion: false,
  rawAttributes: jest.fn().mockReturnValue(fakeTextItemAttrs),
  getRecordType: jest.fn().mockReturnValue('items'),
  API_destroyQuestionChoice: jest.fn().mockReturnValue(Promise.resolve()),
  API_createQuestionChoice: jest.fn().mockReturnValue(Promise.resolve()),
  ...fakeJsonApiAttrs,
}

export const fakeQuestionAnswer = {
  answer_text: 'Great!',
  answer_number: 1,
  question_id: fakeQuestionItem.id,
  selected_choice_ids: [],
}

export const fakeQuestionChoice = {
  text: 'Option A',
  question_item_id: fakeQuestionItem.id,
  order: 0,
  value: '0',
  id: 1,
}

export const fakeQuestionSecondChoice = {
  text: 'Option B',
  question_item_id: fakeQuestionItem.id,
  order: 1,
  value: '1',
  id: 2,
}

export const fakeItemCard = {
  id: '10',
  order: 0,
  height: 1,
  width: 1,
  maxWidth: 1,
  record: fakeTextItem,
  item: fakeTextItem,
  image_contain: false,
  API_create: jest.fn(),
  API_archive: jest.fn(),
  API_linkToMyCollection: jest.fn(),
  ...fakeJsonApiAttrs,
}

export const fakeQuestionItemCard = {
  ...fakeItemCard,
  record: fakeQuestionItem,
  card_question_type: fakeQuestionItem.question_type,
}

const fakeCards = [fakeItemCard, fakeItemCard, fakeItemCard]

export const fakeCollection = {
  id: '1',
  name: 'My Workspace X',
  pageTitle: 'My Workspace X | Shape',
  type: 'Collection',
  breadcrumb: [],
  roles: [],
  tag_list: ['prototype', 'blockchain'],
  inherited_tag_list: [],
  can_edit: false,
  can_view: true,
  can_edit_content: false,
  master_template: false,
  isCollection: true,
  isSharedCollection: false,
  isUserCollection: false,
  isNormalCollection: true,
  num_survey_responses: 0,
  anyone_can_view: false,
  anyone_can_join: false,
  show_icon_on_cover: false,
  icon: null,
  recordsPerPage: 50,
  searchRecordsPerPage: 20,
  updated_at: "2019-11-22T18:57:12.863Z",
  cover: {
    image_url: 'http://fake.url.net',
    text: 'Lorem ipsum blockchain boogie',
    name: 'Proto-typo',
    hardcoded_subtitle: 'Lorem ipsum hardcoded',
    subtitle_hidden: false,
  },
  links: {
    self: 'https://www.shape.space/ideo/collections/1',
  },
  collection_filters: [],
  filterBarFilters: [],
  methodLibraryFilters: [],
  isParentMethodLibrary: false,
  collection_cards: fakeCards,
  sortedCards: fakeCards,
  sortedCoverCards: fakeCards,
  sortedBackgroundCards: fakeCards,
  parent_collection_card: fakeCollectionCard,
  // This is a computed property on the collection store
  cardIds: _.map(fakeCards, c => c.id),
  addCard: jest.fn(),
  setCollaborators: jest.fn(),
  collaborators: [],
  tags: [
    {label: 'llamas', type: 'tag_list'},
    {label: 'pajamas', type: 'tag_list'},
    {label: 'shape-test-user', type: 'user_tag_list', user: null}
  ],
  addTag: jest.fn(),
  removeTag: jest.fn(),
  API_archive: jest.fn(),
  API_updateCard: jest.fn(),
  API_updateNameAndCover: jest.fn(),
  API_getNextAvailableTest: jest.fn().mockReturnValue(Promise.resolve(null)),
  API_clearCollectionCover: jest.fn(),
  API_clearBackgroundImage: jest.fn(),
  API_fetchCards: jest.fn().mockReturnValue(Promise.resolve({})),
  API_fetchCard: jest.fn().mockReturnValue(Promise.resolve({})),
  API_fetchCardRoles: jest.fn().mockReturnValue(Promise.resolve({})),
  API_fetchAndMergeCards: jest.fn().mockReturnValue(Promise.resolve({})),
  API_batchUpdateCardsWithUndo: jest.fn().mockReturnValue(Promise.resolve({})),
  API_createCollectionFilter: jest.fn().mockReturnValue(Promise.resolve({})),
  API_destroyCollectionFilter: jest.fn().mockReturnValue(Promise.resolve({})),
  API_selectDatasetsWithIdentifier: jest
    .fn()
    .mockReturnValue(Promise.resolve({})),
  API_unselectDatasetsWithIdentifier: jest
    .fn()
    .mockReturnValue(Promise.resolve({})),
  API_removeComparison: jest.fn().mockReturnValue(Promise.resolve({})),
  API_addComparison: jest.fn().mockReturnValue(Promise.resolve({})),
  API_selectCollectionType: jest.fn().mockReturnValue(Promise.resolve({})),
  API_manipulateRow: jest.fn().mockReturnValue(Promise.resolve({})),
  API_fetchCardOrders: jest.fn().mockReturnValue(Promise.resolve({})),
  API_fetchChallengePhaseCollections: jest.fn().mockReturnValue(Promise.resolve({})),
  refetch: jest.fn(),
  initializeTags: jest.fn(),
  reloadDataItemsDatasets: jest.fn().mockReturnValue(Promise.resolve({})),
  checkCurrentOrg: jest.fn(),
  confirmEdit: jest.fn(),
  updateScrollBottom: jest.fn(),
  clearCollectionCards: jest.fn(),
  toJsonApiWithCards: jest.fn(),
  mergeCards: jest.fn(),
  revertToSnapshot: jest.fn(),
  removeCardIds: jest.fn(),
  setCarouselIdx: jest.fn(),
  setViewMode: jest.fn(),
  setLatestCollaborator: jest.fn(),
  cardProperties: [],
  internalType: 'collections',
  collection_type: 'method',
  phaseSubCollections: [],
  loadPhaseSubCollections: jest.fn().mockReturnValue(Promise.resolve([])),
  setPhaseSubCollections: jest.fn(),
  applyRemoteUpdates: jest.fn(),
  meta: {
    snapshot: {
      can_edit: false,
    },
  },
  ...fakeJsonApiAttrs,
}
fakeCollection.loadPhasesForSubmissionBoxes = submissionBoxes => {
  submissionBoxes.map(submissionBox => {
    // Append phase subcollections
    if (submissionBox.submission_template) {
      submissionBox.phaseSubCollections = [
        {
          ...fakeCollection,
          id: '4560202',
          name: 'Phase Collection',
        },
      ]
    }
  })
  // Immediately resolve promise for the test
  return Promise.resolve(submissionBoxes)
}
// also set parentCollection on fakeCard
// TODO: fix circular reference!
fakeCollectionCard.parentCollection = { ...fakeCollection }

export const fakeGroupAttrs = {
  id: '1',
  name: 'IDEO Products',
  handle: 'ideo-products',
  internalType: 'groups',
  filestack_file_url: 'https://cdn.filestackcontent.com/i4iKADquTQCWMAvyz02R',
  roles: [],
  can_edit: true,
}
export const fakeGroup = {
  ...fakeJsonApiAttrs,
  ...fakeGroupAttrs,
  rawAttributes: jest.fn().mockReturnValue(fakeGroupAttrs),
  getRecordType: jest.fn().mockReturnValue('groups'),
}
export const fakeOrganizationAttrs = {
  id: '1',
  name: 'TestOrg',
  slug: 'test-org',
  primary_group: fakeGroup,
  guest_group: fakeGroup,
  admin_group: fakeGroup,
}
export const fakeOrganization = {
  ...fakeOrganizationAttrs,
  searchTagsAndUsers: jest.fn().mockReturnValue(Promise.resolve({})),
  rawAttributes: jest.fn().mockReturnValue(fakeOrganizationAttrs),
  getRecordType: jest.fn().mockReturnValue('organization'),
}
export const fakeUserAttrs = {
  id: '1',
  first_name: 'Oprah',
  last_name: 'Winfrey',
  name: 'Oprah Winfrey',
  email: 'oprah@winfrey.com',
  pic_url_square: 'https://filestackcdn.com/abc123',
  groups: [],
  current_organization: fakeOrganization,
  type: 'users',
  terms_accepted: true,
  isCurrentUser: true,
  feedback_contact_preference: 'feedback_contact_unanswered',
  API_updateCurrentUser: jest.fn(),
  API_updateSurveyRespondent: jest.fn(),
  API_hideHelper: jest.fn().mockReturnValue(Promise.resolve({})),
  API_updateUseTemplateSetting: jest.fn().mockReturnValue(Promise.resolve({})),
  notify_through_email: true,
  show_move_modal: false,
}
export const fakeActionCableUser = {
  id: '99',
  name: 'Oprah Winfrey',
  pic_url_square: 'https://filestackcdn.com/abc123',
}
export const fakeUser = {
  ...fakeUserAttrs,
  rawAttributes: jest.fn().mockReturnValue(fakeUserAttrs),
  getRecordType: jest.fn().mockReturnValue('users'),
}
export const fakeRoleAttrs = {
  id: '1',
  name: 'editor',
  users: [fakeUser, fakeUser],
  groups: [],
  resource: { id: '1', type: 'collection', internalType: 'collection' },
  API_delete: jest.fn().mockReturnValue(Promise.resolve({})),
}
export const fakeRole = {
  ...fakeRoleAttrs,
  rawAttributes: jest.fn().mockReturnValue(fakeRoleAttrs),
  getRecordType: jest.fn().mockReturnValue('roles'),
  canEdit: jest.fn(),
}
export const fakePosition = {
  xPos: 0,
  yPos: 0,
  height: 1,
  width: 1,
}
export const fakeComment = {
  id: '1',
  author: fakeUser,
  message:
    'This is my message to the world. Go to the source: https://www.ideo.com',
  draftjs_data: {
    blocks: [
      {
        key: '74h6f',
        data: {},
        text:
          'This is my message to the world. Go to the source: https://www.ideo.com',
        type: 'unstyled',
        depth: 0,
        entityRanges: [],
        inlineStyleRanges: [],
      },
    ],
    entityMap: {},
  },
  replies: [],
  created_at: new Date('2019-05-09T03:18:00'),
  updated_at: new Date('2019-05-09T03:18:00'),
  API_fetchReplies: jest.fn().mockReturnValue(Promise.resolve({})),
  expandAndFetchReplies: jest.fn().mockReturnValue(Promise.resolve({})),
}
export const fakeThread = {
  id: '1',
  persisted: true,
  record: fakeCollection,
  key: 'collection-1',
  unread_count: 2,
  comments: [fakeComment, fakeComment, fakeComment],
  users_thread: {
    subscribed: true,
    get currentSubscribed() {
      return this.subscribed
    },
  },
  visibleCommentsAndRepliesCount: 1,
  API_saveComment: jest.fn().mockReturnValue(Promise.resolve({})),
  API_fetchComments: jest.fn().mockReturnValue(Promise.resolve({})),
  API_subscribe: jest.fn().mockReturnValue(Promise.resolve({})),
  API_unsubscribe: jest.fn().mockReturnValue(Promise.resolve({})),
}

export const fakeActivity = {
  id: '1',
  type: 'activities',
  action: 'archived',
  actor: fakeUser,
  created_at: new Date(),
  subject_users: [],
  subject_groups: [],
  target: fakeCollection,
  target_type: 'Collection',
  target_id: fakeCollection.id,
  setTarget: jest.fn(),
  ...fakeJsonApiAttrs,
}
export const fakeNotification = {
  id: '1',
  type: 'notifications',
  read: false,
  activity: fakeActivity,
  combined_actors: [],
  combined_activities_ids: [],
  user: fakeUser,
  ...fakeJsonApiAttrs,
}
export const fakeSurveyResponse = {
  id: '1',
  type: 'survey_responses',
  status: 'in_progress',
  question_answers: [],
  ...fakeJsonApiAttrs,
}
export const fakeAudience = {
  id: '1',
  name: 'Anybody',
  min_price_per_response: 4.0,
}
export const fakeTestAudience = {
  id: '1',
  audience: fakeAudience,
  sample_size: 12,
  num_completed_responses: 6,
  price_per_response: 4.24,
  incentive_per_response: 1.95,
}
export const fakeTestCollection = {
  id: '1',
  type: 'test_collections',
  name: 'Test Collection',
  test_launched_at: new Date('2019-05-09T03:18:00'),
  test_audiences: [fakeTestAudience],
}

export const fakeCollectionFilter = {
  id: '1',
  filter_type: 'tag',
  text: 'plants',
  selected: true,
  API_toggleSelected: jest.fn().mockReturnValue(Promise.resolve({})),
}

export const fakeCollaborator = {
  id: '1',
  can_edit_collection: false,
  timestamp: '2020-04-30 11:34:50 -0700',
  color: 'Blue'
}

export const fakeSubmissionBoxWithTemplate = {
  ...fakeCollection,
  name: 'Submission Box with Template',
  submission_template_id: 123,
  submission_template: {
    ...fakeCollection,
    name: 'Submission Box Template'
  },
  submission_box_type: null,
  submissionFormat: 'template'
}

export const fakeSubmissionBoxWithoutTemplate = {
  ...fakeCollection,
  name: 'Submission Box without Template',
  submission_box_type: 'text',
  submission_template_id: null,
  submission_template: null,
  submissionFormat: 'item'
}
