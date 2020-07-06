import CollectionIcon from '~/ui/icons/CollectionIcon'

let props, wrapper, rerender
describe('CollectionIcon', () => {
  beforeEach(() => {
    props = {
      size: 'xs',
      type: 'phase',
    }
    rerender = () => {
      wrapper = shallow(<CollectionIcon {...props} />)
    }
    rerender()
  })

  it('renders icon matching type and size', () => {
    expect(wrapper.find('PhaseIcon').props().size).toEqual('xs')
  })

  it('renders default icon if no type given', () => {
    props = {}
    rerender()
    expect(wrapper.find('DefaultCollectionIcon').props().size).toEqual('md')
  })

  it('passes props to icon', () => {
    props.viewBox = '0 0 25 25'
    rerender()
    expect(wrapper.find('PhaseIcon').props().viewBox).toEqual('0 0 25 25')
  })
})
