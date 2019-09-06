import CollectionCover from '~/ui/grid/covers/CollectionCover'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollection } from '#/mocks/data'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

const props = {
  collection: fakeCollection,
  width: 2,
  height: 1,
  uiStore: fakeUiStore,
}
const { cover } = fakeCollection

const fakeEvent = {
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  metaKey: null,
}

let wrapper, component
describe('CollectionCover', () => {
  beforeEach(() => {
    props.collection = {
      ...fakeCollection,
      is_inside_a_submission: false,
    }
    wrapper = shallow(<CollectionCover.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  it('renders the cover image_url', () => {
    expect(wrapper.find('StyledCollectionCover').props().url).toEqual(
      cover.image_url
    )
  })

  it('renders the collection name and cover text', () => {
    expect(
      wrapper
        .find('PlainLink')
        .at(0)
        .children()
        .text()
    ).toContain(fakeCollection.name)
    expect(
      wrapper
        .find('Dotdotdot')
        .at(1)
        .children()
        .text()
    ).toContain(cover.text)
    expect(component.numberOfLinesForDescription).toEqual(3)
  })

  it('does not render the launch test button if not in a submission', () => {
    expect(wrapper.find('LaunchButton').exists()).toBeFalsy()
  })

  it('does not show permission alert', () => {
    wrapper
      .find('[data-cy="collection-cover-link"]')
      .simulate('click', fakeEvent)
    expect(props.uiStore.showPermissionsAlert).not.toHaveBeenCalled()
  })

  it('does not show the cover button', () => {
    expect(wrapper.find('CardButtonWrapper').exists()).toBeFalsy()
  })

  describe('with a launchable submission test', () => {
    beforeEach(() => {
      props.collection = {
        ...fakeCollection,
        id: '99',
        is_inside_a_submission: true,
        launchableTestId: '99',
        launchable: true,
      }
      wrapper = shallow(<CollectionCover.wrappedComponent {...props} />)
    })

    it('renders the launch test button', () => {
      expect(wrapper.find('LaunchButton').exists()).toBeTruthy()
    })
  })

  describe('with collection user cannot view', () => {
    beforeEach(() => {
      props.collection.can_view = false
      wrapper = shallow(<CollectionCover.wrappedComponent {...props} />)
    })

    it('shows permission alert', () => {
      wrapper
        .find('[data-cy="collection-cover-link"]')
        .simulate('click', fakeEvent)
      expect(props.uiStore.showPermissionsAlert).toHaveBeenCalled()
    })
  })

  describe('with template', () => {
    beforeEach(() => {
      props.collection.isMasterTemplate = true
      props.collection.isUsableTemplate = true
      wrapper = shallow(<CollectionCover.wrappedComponent {...props} />)
      component = wrapper.instance()
    })

    it('shows the use template button for master templates', () => {
      expect(wrapper.find('CardButtonWrapper').exists()).toBeTruthy()
    })

    it('reduces the number of lines for the description', () => {
      expect(component.numberOfLinesForDescription).toEqual(2)
    })
  })
})
