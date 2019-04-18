import TestDesigner from '~/ui/test_collections/TestDesigner'
import { fakeCollection } from '#/mocks/data'
import fakeApiStore from '#/mocks/fakeApiStore'

import v from '~/utils/variables'

let wrapper, props, instance, component
describe('TestDesigner', () => {
  beforeEach(() => {
    props = {
      collection: fakeCollection,
    }
    // very basic way to turn fakeCollection into a "test collection"
    props.collection.collection_cards[0].card_question_type = 'question_useful'
    props.collection.apiStore = fakeApiStore({
      requestResult: { data: { id: 99, name: 'Parent Collection' } },
    })
    wrapper = shallow(<TestDesigner {...props} />)
  })

  it('renders TestQuestions for each card', () => {
    expect(wrapper.find('TestQuestion').length).toEqual(
      fakeCollection.collection_cards.length
    )
  })

  it('renders Select form with card_question_type selected', () => {
    expect(wrapper.find('StyledSelect').get(0).props.value).toEqual(
      'question_useful'
    )
  })

  it('renders the question options alphabetically', () => {
    const select = wrapper.find('StyledSelect StyledSelectOption')
    expect(select.get(0).props.value).toEqual('question_category_satisfaction')
    expect(select.get(1).props.value).toEqual('question_clarity')
  })

  it('passes position props for beginning and end', () => {
    expect(wrapper.find('TestQuestion').get(0).props.position).toEqual(
      'question_beginning'
    )
    expect(wrapper.find('TestQuestion').get(1).props.position).toEqual(
      undefined
    )
    expect(wrapper.find('TestQuestion').get(2).props.position).toEqual(
      'question_end'
    )
  })

  describe('with draft test_collection', () => {
    beforeEach(() => {
      props.collection.test_status = 'draft'
      wrapper = shallow(<TestDesigner {...props} />)
    })
    it('should render the testTypeForm set to "media" by default', () => {
      expect(wrapper.find('RadioControl').exists()).toBeTruthy()
      expect(wrapper.find('RadioControl').props().selectedValue).toEqual(
        'media'
      )
    })
  })

  describe('with live test_collection', () => {
    beforeEach(() => {
      props.collection.can_edit_content = true
      props.collection.test_status = 'live'
      props.collection.isLiveTest = true
      wrapper = shallow(<TestDesigner {...props} />)
    })

    it('prompts user when adding a new question', () => {
      wrapper
        .find('QuestionHotEdge')
        .first()
        .props()
        .onAdd()
      expect(props.collection.apiStore.uiStore.confirm).toHaveBeenCalledWith({
        confirmText: 'Continue',
        iconName: 'Alert',
        onConfirm: expect.any(Function),
        prompt:
          'This test has been launched. Are you sure you want to add a new question?',
      })
    })

    describe('handleSelectChange', () => {
      beforeEach(() => {
        instance = wrapper.instance()
        const fakeEv = {
          preventDefault: jest.fn(),
          target: { value: 'question_excitement' },
        }
        instance.handleSelectChange(props.collection.collection_cards[0])(
          fakeEv
        )
      })

      it('prompts user when changing a question type', () => {
        expect(props.collection.apiStore.uiStore.confirm).toHaveBeenCalledWith({
          confirmText: 'Continue',
          iconName: 'Alert',
          onConfirm: expect.any(Function),
          prompt:
            'This test has been launched. Are you sure you want to change the question type?',
        })
      })
    })
  })

  describe('with collection_to_test', () => {
    beforeEach(() => {
      props.collection.collection_to_test = { ...fakeCollection }
      props.collection.collection_to_test_id = fakeCollection.id
      wrapper = shallow(<TestDesigner {...props} />)
      component = wrapper.instance()
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
})
