import TestQuestion from '~/ui/test_collections/TestQuestion'
import { fakeCollection, fakeItemCard, fakeQuestionItem } from '#/mocks/data'

let wrapper, props
describe('TestQuestion', () => {
  beforeEach(() => {
    props = {
      parent: fakeCollection,
      card: fakeItemCard,
      item: fakeQuestionItem,
      editing: true,
      numberOfQuestions: 4,
    }
  })

  describe('with "useful" type', () => {
    beforeEach(() => {
      props.card.card_question_type = 'question_useful'
      wrapper = shallow(<TestQuestion {...props} />)
    })

    it('renders ScaleQuestion', () => {
      expect(wrapper.find('ScaleQuestion').exists()).toBeTruthy()
    })
  })

  describe('with "media" type', () => {
    beforeEach(() => {
      props.card.card_question_type = 'question_media'
      wrapper = shallow(<TestQuestion {...props} />)
    })

    it('renders GridCardBlank to insert media', () => {
      expect(wrapper.find('GridCardBlank').exists()).toBeTruthy()
    })
  })

  describe('with "description" type', () => {
    beforeEach(() => {
      props.card.card_question_type = 'question_description'
      wrapper = shallow(<TestQuestion {...props} />)
    })

    it('renders DescriptionQuestion', () => {
      expect(wrapper.find('DescriptionQuestion').props().item).toEqual(
        props.item
      )
    })
  })

  describe('with "question_finish" type', () => {
    beforeEach(() => {
      props.parent.gives_incentive = true
      props.card.card_question_type = 'question_finish'
      wrapper = shallow(<TestQuestion {...props} />)
    })

    it('renders DescriptionQuestion', () => {
      const finishQuestion = wrapper.find('FinishQuestion')
      expect(finishQuestion.props().givesIncentive).toEqual(
        props.parent.gives_incentive
      )
    })
  })
})
