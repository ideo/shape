import TestDesigner from '~/ui/test_collections/TestDesigner'
import { fakeCollection } from '#/mocks/data'

let wrapper, props
describe('TestDesigner', () => {
  beforeEach(() => {
    props = {
      collection: fakeCollection,
    }
    // very basic way to turn fakeCollection into a "test collection"
    props.collection.collection_cards[0].card_question_type = 'useful'
    wrapper = shallow(<TestDesigner {...props} />)
  })

  it('renders TestQuestions for each card', () => {
    expect(wrapper.find('TestQuestion').length).toEqual(
      fakeCollection.collection_cards.length
    )
  })

  it('renders Select form with card_question_type selected', () => {
    expect(wrapper.find('StyledSelect').get(0).props.value).toEqual('useful')
  })

  it('passes position props for beginning and end', () => {
    expect(wrapper.find('TestQuestion').get(0).props.position).toEqual(
      'beginning'
    )
    expect(wrapper.find('TestQuestion').get(1).props.position).toEqual(
      undefined
    )
    expect(wrapper.find('TestQuestion').get(2).props.position).toEqual('end')
  })
})
