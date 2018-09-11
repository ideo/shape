import TestQuestionEditor from '~/ui/test_collections/TestQuestionEditor'
import {
  fakeCollection,
  fakeItemCard,
  fakeQuestionItem,
} from '#/mocks/data'

let wrapper, props
describe('TestDesigner', () => {
  beforeEach(() => {
    props = {
      parent: fakeCollection,
      card: fakeItemCard,
      item: fakeQuestionItem,
    }
  })

  describe('with "useful" type', () => {
    beforeEach(() => {
      props.card.card_question_type = 'useful'
      wrapper = shallow(
        <TestQuestionEditor {...props} />
      )
    })

    it('renders Select form with card_question_type selected', () => {
      expect(wrapper.find('StyledSelect').props().value).toEqual('useful')
    })

    it('renders ScaleQuestion', () => {
      expect(wrapper.find('ScaleQuestion').exists()).toBeTruthy()
    })
  })

  describe('with "media" type', () => {
    beforeEach(() => {
      props.card.card_question_type = 'media'
      wrapper = shallow(
        <TestQuestionEditor {...props} />
      )
    })

    it('renders Select form with card_question_type selected', () => {
      expect(wrapper.find('StyledSelect').props().value).toEqual('media')
    })

    it('renders GridCardBlank to insert media', () => {
      expect(wrapper.find('GridCardBlank').exists()).toBeTruthy()
    })
  })

  describe('with "description" type', () => {
    beforeEach(() => {
      props.card.card_question_type = 'description'
      wrapper = shallow(
        <TestQuestionEditor {...props} />
      )
    })

    it('renders Select form with card_question_type selected', () => {
      expect(wrapper.find('StyledSelect').props().value).toEqual('description')
    })

    it('renders DescriptionQuestion', () => {
      expect(wrapper.find('DescriptionQuestion').props().item).toEqual(props.item)
    })
  })
})
