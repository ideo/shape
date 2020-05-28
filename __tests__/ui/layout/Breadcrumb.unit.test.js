import Breadcrumb from '~/ui/layout/Breadcrumb'
import { fakeCollection } from '#/mocks/data'
import { apiStore } from '~/stores'

jest.mock('../../../app/javascript/stores')

apiStore.currentUserCollectionId = '123'
const props = {
  record: fakeCollection,
  isHomepage: false,
}
props.record.breadcrumb = [
  { type: 'collections', id: 1, name: 'My Workspace' },
  { type: 'collections', id: 99, name: 'Use Cases' },
]

let wrapper, component, titles

describe('Breadcrumb', () => {
  beforeEach(() => {
    props.record.in_my_collection = false
    wrapper = shallow(<Breadcrumb {...props} />)
    component = wrapper.instance()
    titles = component.truncatedItems.map(t => t.name)
  })

  it('renders each item as a breadcrumb item', () => {
    expect(wrapper.find('.breadcrumb_item')).toHaveLength(
      props.record.breadcrumb.length
    )
  })

  it('has all link titles', () => {
    expect(titles).toEqual(['My Workspace', 'Use Cases'])
  })
})

describe('With narrow window and more breadcrumb items', () => {
  beforeEach(() => {
    props.breadcrumbWrapper = {
      current: {
        offsetWidth: 400,
      },
    }
    wrapper = shallow(
      <Breadcrumb
        {...props}
        record={{
          ...props.record,
          in_my_collection: true,
          breadcrumb: [
            { type: 'collections', id: 1, name: 'My Workspace' },
            { type: 'collections', id: 12, name: 'One more Level' },
            { type: 'collections', id: 99, name: 'Use Cases' },
          ],
        }}
      />
    )
    component = wrapper.instance()
    titles = component.truncatedItems
  })

  it('truncates to …', () => {
    expect(titles[1].ellipses).toBe(true)
  })

  it('sets the last subItem as isEllipsesLink', () => {
    const subItem = titles[1].subItems[2]
    expect(subItem.isEllipsesLink).toBe(true)
    expect(subItem.name).toEqual('One more Level')
  })
})

describe('In My Collection', () => {
  beforeEach(() => {
    props.record.in_my_collection = true
    props.breadcrumbWrapper = {
      current: {
        offsetWidth: 900,
      },
    }
    wrapper = shallow(<Breadcrumb {...props} />)
    component = wrapper.instance()
    titles = component.truncatedItems.map(t => t.name)
  })

  it('renders each item as a breadcrumb item', () => {
    expect(wrapper.find('.breadcrumb_item')).toHaveLength(
      props.record.breadcrumb.length + 1
    )
  })

  it('has My Collection, then all titles', () => {
    expect(titles).toEqual(['My Collection', 'My Workspace', 'Use Cases'])
  })
})

describe('BreadcrumbPadding', () => {
  beforeEach(() => {
    wrapper = shallow(<Breadcrumb {...props} isHomepage />)
  })

  it('renders BreadcrumbPadding if isHomepage', () => {
    expect(wrapper.find('BreadcrumbPadding').exists()).toEqual(true)
  })
})
