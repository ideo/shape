import QuestionSelectHolder from '~/ui/test_collections/QuestionSelectHolder'
import { fakeCollection } from '#/mocks/data'
import fakeApiStore from '#/mocks/fakeApiStore'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

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
    wrapper = shallow(<QuestionSelectHolder {...props} />)
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })
})
