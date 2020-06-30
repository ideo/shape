import CollectionTypeIcon, {
  collectionIcon,
  smallCollectionTypeIconMap,
  largeCollectionTypeIconMap,
} from '~/ui/global/CollectionTypeIcon'
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

    it('renders the circled and filled template icon', () => {
      expect(wrapper.find('TemplateIcon').exists()).toBeTruthy()
      expect(wrapper.find('TemplateIcon').props().circled).toBeTruthy()
      expect(wrapper.find('TemplateIcon').props().filled).toBeTruthy()
    })
  })

  describe('when isTemplated and not isSubTemplate', () => {
    beforeEach(() => {
      props.record.isTemplated = true
      props.record.isSubTemplate = false
      wrapper = shallow(<CollectionTypeIcon {...props} />)
    })

    it('renders the circled template icon', () => {
      expect(wrapper.find('TemplateIcon').exists()).toBeTruthy()
      expect(wrapper.find('TemplateIcon').props().circled).toBeTruthy()
      expect(wrapper.find('TemplateIcon').props().filled).toBeFalsy()
    })
  })

  describe('with a launchableTestId', () => {
    beforeEach(() => {
      props.record.isTemplated = false
      props.record.isMasterTemplate = false

      props.record.isTestCollectionOrResults = false
      props.record.launchableTestId = 99
      wrapper = shallow(<CollectionTypeIcon {...props} />)
    })

    it('renders the test collection icon', () => {
      expect(wrapper.find('TestCollectionIcon').exists()).toBeTruthy()
    })
  })

  describe('with isTestCollectionOrResults', () => {
    beforeEach(() => {
      props.record.isTestCollectionOrResults = true
      props.record.launchableTestId = null
      wrapper = shallow(<CollectionTypeIcon {...props} />)
    })

    it('renders the test collection icon', () => {
      expect(wrapper.find('TestCollectionIcon').exists()).toBeTruthy()
    })
  })

  describe('when isBoard', () => {
    beforeEach(() => {
      props.record.isTestCollectionOrResults = false
      props.record.launchableTestId = null

      props.record.isBoard = true
      wrapper = shallow(<CollectionTypeIcon {...props} />)
    })

    it('renders the FoamcoreBoardIcon', () => {
      expect(wrapper.find('FoamcoreBoardIcon').exists()).toBeTruthy()
      expect(wrapper.find('FoamcoreBoardIcon').props().large).toBeTruthy()
    })
  })

  describe('when isUserProfile', () => {
    beforeEach(() => {
      props.record.isUserProfile = true
      wrapper = shallow(<CollectionTypeIcon {...props} />)
    })

    it('renders the ProfileIcon', () => {
      expect(wrapper.find('ProfileIcon').exists()).toBeTruthy()
    })
  })

  describe('when isProfileTemplate', () => {
    beforeEach(() => {
      props.record.isUserProfile = false

      props.record.isProfileTemplate = true
      wrapper = shallow(<CollectionTypeIcon {...props} />)
    })
    it('renders the FilledProfileIcon', () => {
      expect(wrapper.find('FilledProfileIcon').exists()).toBeTruthy()
    })
  })

  describe('when isProfileCollection', () => {
    beforeEach(() => {
      props.record.isProfileTemplate = false

      props.record.isProfileCollection = true
      wrapper = shallow(<CollectionTypeIcon {...props} />)
    })
    it('renders the SystemIcon', () => {
      expect(wrapper.find('SystemIcon').exists()).toBeTruthy()
    })
  })
})
