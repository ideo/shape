import Breadcrumb from '~/ui/layout/Breadcrumb'
import { fakeCollection } from '#/mocks/data'

jest.mock('../../../app/javascript/stores')

const props = {
  record: fakeCollection,
  isHomepage: false,
}
props.record.breadcrumb = [
  ['collections', 1, 'My Workspace'],
  ['collections', 99, 'Use Cases'],
]

let wrapper

describe('StyledBreadcrumb', () => {
  beforeEach(() => {
    props.record.inMyCollection = false
    wrapper = shallow(<Breadcrumb {...props} />)
  })

  it('renders each item as a link', () => {
    expect(wrapper.find('Link')).toHaveLength(props.record.breadcrumb.length)
  })

  it('has all link titles', () => {
    const titles = wrapper
      .find('Link')
      .children()
      .map(link => link.text())
    expect(titles).toEqual(['My Workspace', 'Use Cases'])
  })
})

describe('In My Collection', () => {
  beforeEach(() => {
    props.record.inMyCollection = true
    wrapper = shallow(<Breadcrumb {...props} />)
  })

  it('renders each item as a link', () => {
    expect(wrapper.find('Link')).toHaveLength(
      props.record.breadcrumb.length + 1
    )
  })

  it('has My Collection, then all titles', () => {
    const titles = wrapper
      .find('Link')
      .children()
      .map(link => link.text())
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
