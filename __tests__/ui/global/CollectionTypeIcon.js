import CollectionTypeIcon from '~/ui/global/CollectionTypeIcon'
import { fakeCollection } from '#/mocks/data'

const props = {
  record: fakeCollection,
}
let wrapper

describe('CollectionTypeIcon', () => {
  beforeEach(() => {
    wrapper = shallow(<CollectionTypeIcon {...props} />)
  })

  describe('with a MasterTemplate collection', () => {
    beforeEach(() => {
      props.record.isMasterTemplate = true
      wrapper = shallow(<CollectionTypeIcon {...props} />)
    })

    it('renders the template icon', () => {
      expect(wrapper.find('TemplateIcon').exists()).toBeTruthy()
    })
  })

  describe('with a TestCollection', () => {
    beforeEach(() => {
      props.record.isMasterTemplate = false
      props.record.launchableTestId = 99
      wrapper = shallow(<CollectionTypeIcon {...props} />)
    })

    it('renders the template icon', () => {
      expect(wrapper.find('TestCollectionIcon').exists()).toBeTruthy()
    })
  })
})
