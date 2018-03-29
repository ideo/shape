import Breadcrumb from '~/ui/layout/Breadcrumb'

const props = {
  items: [
    ['Collection', 1, 'Outer Space'],
    ['Item', 5, 'Earth'],
    ['Collection', 42, 'California']
  ]
}

const emptyProps = {
  items: []
}

let wrapper

describe('StyledBreadcrumb', () => {
  beforeEach(() => {
    wrapper = shallow(
      <Breadcrumb {...props} />
    )
  })

  it('renders each item as a link', () => {
    expect(wrapper.find('Link')).toHaveLength(4)
  })

  it('has My Collection, then all titles', () => {
    const titles = wrapper.find('Link').children().map(link => link.text())
    expect(titles).toEqual(['My Collection', 'Outer Space', 'Earth', 'California'])
  })
})

describe('BreadcrumbPadding', () => {
  beforeEach(() => {
    wrapper = shallow(
      <Breadcrumb {...emptyProps} />
    )
  })

  it('renders BreadcrumbPadding if items is empty', () => {
    expect(wrapper.find('BreadcrumbPadding').exists()).toEqual(true)
  })
})
