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

let wrapper, titles, component

const rerender = (newProps = props) => {
  wrapper = shallow(<Breadcrumb {...newProps} />)
  component = wrapper.instance()
  titles = component.items().map(i => i.name)
}

describe('Breadcrumb', () => {
  beforeEach(() => {
    props.record.inMyCollection = false
    rerender()
  })

  it('renders each item as a BreadcrumbItem', () => {
    expect(wrapper.find('BreadcrumbItem')).toHaveLength(
      props.record.breadcrumb.length
    )
  })

  it('has all link titles', () => {
    titles = component.items().map(i => i.name)
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
    rerender()
  })

  it('truncates to …', () => {
    const truncated = component.truncateItems(component.items())
    expect(truncated[0].name).toEqual('My Collection')
    expect(truncated[0].ellipses).toBeFalsy()
    expect(truncated[1].name).toEqual('My Workspace')
    expect(truncated[1].ellipses).toBeTruthy()
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
    rerender()
  })

  it('renders each item as a BreadcrumbItem', () => {
    expect(wrapper.find('BreadcrumbItem')).toHaveLength(
      props.record.breadcrumb.length + 1
    )
  })

  it('has My Collection, then all titles', () => {
    expect(titles).toEqual(['My Collection', 'My Workspace', 'Use Cases'])
  })
})

describe('BreadcrumbPadding', () => {
  beforeEach(() => {
    rerender({ ...props, isHomepage: true })
  })

  it('renders BreadcrumbPadding if isHomepage', () => {
    expect(wrapper.find('BreadcrumbPadding').exists()).toEqual(true)
  })
})
