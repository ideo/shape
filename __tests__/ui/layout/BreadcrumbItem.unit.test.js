import { BaseBreadcrumbItem } from '~/ui/layout/BreadcrumbItem'
import { fakeTextItem } from '#/mocks/data'

const props = {
  item: fakeTextItem,
  index: 0,
  numItems: 3,
}

let wrapper

const rerender = (newProps = props) => {
  wrapper = shallow(<BaseBreadcrumbItem {...newProps} />)
}

describe('BreadcrumbItem', () => {
  beforeEach(() => {
    rerender()
  })

  it('renders the Link with the item.name', () => {
    expect(wrapper.find('Link').props().children).toEqual(props.item.name)
  })
})
