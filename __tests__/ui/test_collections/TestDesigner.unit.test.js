import TestDesigner from '~/ui/test_collections/TestDesigner'
import { fakeCollection, fakeCollectionCard } from '#/mocks/data'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

import v from '~/utils/variables'
import googleTagManager from '~/vendor/googleTagManager'

jest.mock('../../../app/javascript/vendor/googleTagManager')

let wrapper, props, instance, component, rerender
describe('TestDesigner', () => {
  beforeEach(() => {
    props = {
      collection: {
        ...fakeCollection,
        can_edit: true,
        can_edit_content: true,
        test_show_media: true,
        ideasCollection: { id: '101', ...fakeCollection },
        sortedCards: [
          {
            id: '99',
            card_question_type: 'ideas_collection',
            section_type: 'ideas',
            record: { id: '101', ...fakeCollection },
          },
          {
            ...fakeCollectionCard,
            section_type: 'ideas',
          },
        ],
      },
      apiStore: fakeApiStore({
        requestResult: { data: { id: '99', name: 'Parent Collection' } },
      }),
      uiStore: fakeUiStore,
    }
    // very basic way to turn fakeCollection into a "test collection"
    props.collection.collection_cards[0].card_question_type = 'question_useful'
    props.collection.collection_cards.forEach(
      card => (card.section_type = 'ideas')
    )
    rerender = () => {
      wrapper = shallow(<TestDesigner.wrappedComponent {...props} />)
      component = wrapper.instance()
    }
  })

  describe('with default params', () => {
    beforeEach(() => {
      rerender()
    })

    it('renders TestQuestions for each card', () => {
      expect(wrapper.find('TestQuestion').length).toEqual(
        props.collection.sortedCards.length
      )
    })
  })

  describe('with draft test_collection', () => {
    beforeEach(() => {
      props.collection.isDraftTest = true
      rerender()
    })
    it('should render the testTypeForm set to "media" by default', () => {
      expect(wrapper.find('RadioControl').exists()).toBeTruthy()
      expect(wrapper.find('RadioControl').props().selectedValue).toEqual(
        'media'
      )
    })

    describe('canAddIdeas', () => {
      describe('without edit access', () => {
        beforeEach(() => {
          props.collection.can_edit_content = false
          rerender()
        })
        it('should return false', () => {
          expect(component.canAddIdeas).toEqual(false)
        })
      })
      describe('with edit access', () => {
        beforeEach(() => {
          props.collection.can_edit_content = true
          rerender()
        })
        it('should return true if the ideasCollection is present', () => {
          expect(component.canAddIdeas).toEqual(true)
        })
      })
    })
  })

  describe('with responses', () => {
    beforeEach(() => {
      props.collection.test_status = 'live'
      props.collection.num_survey_responses = 5
      rerender()
    })

    describe('handleSelectChange', () => {
      let card, fakeEv
      beforeEach(() => {
        fakeEv = {
          preventDefault: jest.fn(),
          target: { value: 'question_excitement' },
        }
        card = props.collection.collection_cards[0]
        instance = wrapper.instance()
      })

      it('does not prompt if adding a new question without a type', () => {
        card.card_question_type = null
        instance.handleSelectChange(card)(fakeEv)
        expect(props.uiStore.confirm).not.toHaveBeenCalled()
      })

      it('prompts user when changing a question type', () => {
        card.card_question_type = 'question_clarity'
        instance.handleSelectChange(card)(fakeEv)
        expect(props.uiStore.confirm).toHaveBeenCalledWith({
          confirmText: 'Continue',
          iconName: 'Alert',
          onConfirm: expect.any(Function),
          onCancel: expect.any(Function),
          prompt:
            'This test has 5 responses. Are you sure you want to change the question type?',
        })
      })
    })

    describe('handleTrash', () => {
      let card
      beforeEach(() => {
        card = props.collection.collection_cards[0]
        instance = wrapper.instance()
      })

      it('prompts user when removing a question', () => {
        instance.handleTrash(card)
        expect(props.uiStore.confirm).toHaveBeenCalledWith({
          confirmText: 'Continue',
          iconName: 'Alert',
          onConfirm: expect.any(Function),
          onCancel: expect.any(Function),
          prompt:
            'This test has 5 responses. Are you sure you want to remove this question?',
        })
      })
    })

    describe('trackQuestionCreation', () => {
      it('pushes an event to google tag manager', () => {
        component.trackQuestionCreation()

        expect(googleTagManager.push).toHaveBeenCalledWith({
          event: 'formSubmission',
          formType: 'Create Item::QuestionItem',
        })
      })
    })

    describe('onAdd', () => {
      it('prompts user when adding a new question', () => {
        wrapper
          .find('QuestionHotEdge')
          .first()
          .props()
          .onAdd()
        expect(props.uiStore.confirm).toHaveBeenCalledWith({
          confirmText: 'Continue',
          iconName: 'Alert',
          onConfirm: expect.any(Function),
          onCancel: expect.any(Function),
          prompt:
            'This test has 5 responses. Are you sure you want to add a new question?',
        })
      })
    })

    describe('handleQuestionFocus', () => {
      beforeEach(() => {
        // Clear mock calls so we can isolate them to our test
        props.uiStore.confirm.mockClear()
        // set it as a live test so that the warning does pop up
        props.collection.isLiveTest = true
        instance = wrapper.instance()
      })

      it('prompts user when editing a question', () => {
        instance.handleQuestionFocus()
        expect(props.uiStore.confirm).toHaveBeenCalledWith({
          confirmText: 'Continue',
          iconName: 'Alert',
          onConfirm: expect.any(Function),
          onCancel: expect.any(Function),
          prompt:
            'This test has 5 responses. Are you sure you want to edit this question?',
        })
      })

      describe('if confirm is clicked', () => {
        let confirmCalls
        beforeEach(() => {
          confirmCalls = props.uiStore.confirm.mock.calls
        })

        it('does not prompt (for an hour)', () => {
          instance.handleQuestionFocus()
          // Simulate clicking 'confirm'
          confirmCalls[0][0].onConfirm()
          instance.handleQuestionFocus()
          expect(confirmCalls.length).toEqual(1)
          expect(props.uiStore.confirm).toHaveBeenCalledTimes(1)
        })
      })

      describe('if cancel is clicked', () => {
        let confirmCalls
        beforeEach(() => {
          confirmCalls = props.uiStore.confirm.mock.calls
        })

        it('continues to prompt', () => {
          instance.handleQuestionFocus()
          // Simulate clicking 'cancel'
          confirmCalls[0][0].onCancel()
          instance.handleQuestionFocus()
          // Simulate clicking 'cancel'
          confirmCalls[1][0].onCancel()
          expect(props.uiStore.confirm).toHaveBeenCalledTimes(2)
        })
      })
    })
  })

  describe('createNewQuestionCard', () => {
    beforeEach(() => {
      props.apiStore = fakeApiStore({
        requestResult: {
          data: {
            order: 1,
            record: {
              name: 'some name',
            },
            card_question_type: 'question_useful',
            section_type: 'ideas',
            stopReplacing: jest.fn(),
          },
        },
      })
      rerender()
    })

    it('calls CollectionCard.API_create with params', async () => {
      const card = await component.createNewQuestionCard({
        order: 1,
        section_type: 'ideas',
      })
      expect(props.apiStore.request).toHaveBeenCalledWith(
        'collection_cards',
        'POST',
        expect.any(Object)
      )
      expect(card.record.name).toEqual('some name')
    })

    it('calls CollectionCard.API_replace with params', async () => {
      const card = await component.createNewQuestionCard({
        replacingCard: {
          id: '99',
          section_type: 'ideas',
          order: 1,
        },
      })
      expect(props.apiStore.request).toHaveBeenCalledWith(
        'collection_cards/99/replace',
        'PATCH',
        expect.any(Object)
      )
      expect(card.record.name).toEqual('some name')
    })
  })

  describe('with collection_to_test', () => {
    beforeEach(() => {
      props.collection.collection_to_test = { ...fakeCollection }
      props.collection.collection_to_test_id = fakeCollection.id
      rerender()
    })

    it('should set the state.testType to collection', () => {
      expect(wrapper.state().testType).toEqual('collection')
    })

    it('should render the testTypeForm set to "collection"', () => {
      expect(wrapper.find('RadioControl').props().selectedValue).toEqual(
        'collection'
      )
    })

    it('should use the secondary theme', () => {
      expect(component.styledTheme.borderColor).toEqual(v.colors.secondaryDark)
    })
  })

  describe('with template instance cards with question_type null', () => {
    beforeEach(() => {
      props.collection.isTemplated = true
      const empty_questions = props.collection.sortedCards
      empty_questions.forEach(c => (c.card_question_type = null))
      props.collection.sortedCards = empty_questions
      rerender()
    })
    it('should not render QuestionLeftSide', () => {
      expect(wrapper.find('QuestionLeftSide').exists()).toBe(false)
    })
  })
})
