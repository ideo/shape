import IdeaQuestion from '~/ui/test_collections/IdeaQuestion'
import { fakeCollection, fakeItemCard, fakeQuestionItem } from '#/mocks/data'

let wrapper, props
const rerender = () => {
  wrapper = shallow(<IdeaQuestion {...props} />)
}
describe('IdeaQuestion', () => {
  beforeEach(() => {
    props = {
      parent: fakeCollection,
      card: fakeItemCard,
      canEdit: false,
    }
    props.card.record = fakeQuestionItem
    props.card.card_question_type = 'question_idea'
  })

  describe('QuestionContentEditor', () => {
    beforeEach(() => {
      rerender()
    })

    it('renders QuestionContentEditor', () => {
      expect(wrapper.find('QuestionContentEditor').exists()).toBeTruthy()
    })
  })

  describe('MediaQuestion', () => {
    beforeEach(() => {
      props.parent.test_show_media = true
      rerender()
    })

    it('renders MediaQuestion', () => {
      expect(wrapper.find('MediaQuestion').exists()).toBeTruthy()
    })

    describe('with test_show_media toggled off', () => {
      beforeEach(() => {
        props.parent.test_show_media = false
        rerender()
      })

      it('does not render MediaQuestion', () => {
        expect(wrapper.find('MediaQuestion').exists()).toBeFalsy()
      })
    })
  })
})
