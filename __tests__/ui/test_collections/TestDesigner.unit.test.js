import TestDesigner from '~/ui/test_collections/TestDesigner'
import { fakeCollection } from '#/mocks/data'
import fakeApiStore from '#/mocks/fakeApiStore'
import v from '~/utils/variables'

let wrapper, props, component
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
    it('should render the testTypeForm', () => {
      expect(wrapper.find('RadioControl').exists()).toBeTruthy()
      expect(wrapper.find('RadioControl').props().selectedValue).toEqual(
        'media'
      )
    })
  })

  describe('with colleciton_to_test', () => {
    beforeEach(() => {
      props.collection.collection_to_test = { ...fakeCollection }
      wrapper = shallow(<TestDesigner {...props} />)
      component = wrapper.instance()
    })

    it('should set the state.testType to collection', () => {
      expect(wrapper.state().testType).toEqual('collection')
    })

    it('should use the secondary theme', () => {
      expect(component.styledTheme.borderColor).toEqual(v.colors.secondaryDark)
    })
  })
})
