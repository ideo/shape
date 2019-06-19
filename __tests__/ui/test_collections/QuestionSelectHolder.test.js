import QuestionSelectHolder from '~/ui/test_collections/QuestionSelectHolder'
import { fakeCollectionCard } from '#/mocks/data'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

let wrapper, props
describe('TestDesigner', () => {
  beforeEach(() => {
    props = {
      card: fakeCollectionCard,
      handleTrash: jest.fn().mockName('handleTrash'),
      handleSelectChange: jest.fn().mockName('handleSelectChange'),
      canEdit: true,
      selectedQuestionTypes: [
        fakeCollectionCard.card_question_type,
        fakeCollectionCard.card_question_type,
        fakeCollectionCard.card_question_type,
      ],
    }
    props.card.card_question_type = 'question_useful'
    wrapper = shallow(<QuestionSelectHolder {...props} />)
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  it('renders Select form with card_question_type selected', () => {
    expect(wrapper.find('StyledSelect').get(0).props.value).toEqual(
      'question_useful'
    )
  })

  it('renders the question options alphabetically', () => {
    const select = wrapper.find('StyledSelect StyledSelectOption')

    expect(select.get(2).props.value).toEqual('question_description')
    expect(select.get(3).props.value).toEqual('question_media')
  })
})
