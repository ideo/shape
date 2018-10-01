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

let wrapper, titles

describe('StyledBreadcrumb', () => {
  beforeEach(() => {
    props.record.inMyCollection = false
    wrapper = shallow(<Breadcrumb {...props} />)
    titles = wrapper
      .find('Link')
      .children()
      .map(link => link.text())
  })

  it('renders each item as a link', () => {
    expect(wrapper.find('Link')).toHaveLength(props.record.breadcrumb.length)
  })

  it('has all link titles', () => {
    expect(titles).toEqual(['My Workspace', 'Use Cases'])
  })
})

describe('With Narrow Window', () => {
  beforeEach(() => {
    props.record.inMyCollection = true
    props.breadcrumbWrapper = {
      current: {
        offsetWidth: 400,
      },
    }
    wrapper = shallow(<Breadcrumb {...props} />)
    titles = wrapper
      .find('Link')
      .children()
      .map(link => link.text())
  })

  it('truncates to ...', () => {
    expect(titles).toEqual(['My Collection', '...', 'Use Cases'])
  })
})

describe('In My Collection', () => {
  beforeEach(() => {
    props.record.inMyCollection = true
    props.breadcrumbWrapper = {
      current: {
        offsetWidth: 900,
      },
    }
    wrapper = shallow(<Breadcrumb {...props} />)
    titles = wrapper
      .find('Link')
      .children()
      .map(link => link.text())
  })

  it('renders each item as a link', () => {
    expect(wrapper.find('Link')).toHaveLength(
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
