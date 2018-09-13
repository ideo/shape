import TestDesigner from '~/ui/test_collections/TestDesigner'
import { fakeCollection } from '#/mocks/data'

let wrapper, props
describe('TestDesigner', () => {
  beforeEach(() => {
    props = {
      collection: fakeCollection,
      editing: true,
    }
    wrapper = shallow(
      <TestDesigner {...props} />
    )
  })

  it('renders TestQuestionEditors for each card', () => {
    expect(wrapper.find('TestQuestionEditor').length).toEqual(fakeCollection.collection_cards.length)
  })

  it('passes position props for beginning and end', () => {
    expect(wrapper.find('TestQuestionEditor').get(0).props.position).toEqual('beginning')
    expect(wrapper.find('TestQuestionEditor').get(1).props.position).toEqual(undefined)
    expect(wrapper.find('TestQuestionEditor').get(2).props.position).toEqual('end')
  })
})
