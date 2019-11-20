import _ from 'lodash'
import QuestionSelector from '~/ui/test_collections/QuestionSelector'
import { fakeCollectionCard } from '#/mocks/data'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

let wrapper, props
describe('QuestionSelector', () => {
  beforeEach(() => {
    props = {
      card: fakeCollectionCard,
      handleTrash: jest.fn().mockName('handleTrash'),
      handleSelectChange: jest.fn().mockName('handleSelectChange'),
      canEdit: true,
    }
    props.card.card_question_type = 'question_useful'
    props.card.section_type = 'ideas'
    wrapper = shallow(<QuestionSelector {...props} />)
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  it('renders Select form with card_question_type selected', () => {
    expect(wrapper.find('StyledSelect').get(0).props.value).toEqual(
      'question_useful'
    )
  })

  it('renders the question options', () => {
    const select = wrapper.find('StyledSelect StyledSelectOption')
    const values = _.compact(select.map(n => n.props().value))
    expect(values).toEqual([
      'question_clarity',
      'question_different',
      'question_excitement',
      'question_useful',
      'question_multiple_choice',
      'question_open',
      'question_media',
      'question_single_choice',
      'question_description',
    ])
  })
})
