import DataTargetButton from '~/ui/reporting/DataTargetButton'

let wrapper
const props = {}
const render = () => {
  wrapper = shallow(<DataTargetButton {...props} />)
}

describe('DataTargetButton', () => {
  beforeEach(() => {
    props.onClick = jest.fn()
    props.editable = true
  })

  describe('render', () => {
    it('passes editable and onClick through', () => {
      render()
      expect(wrapper.props().editable).toEqual(props.editable)
      expect(wrapper.props().onClick).toEqual(props.onClick)
    })

    describe('targetCollection is present', () => {
      beforeEach(() => {
        props.targetCollection = {
          name: 'A Test Collection',
        }
        render()
      })

      it('sets the button text to the collection name', () => {
        expect(wrapper.children().text()).toEqual(props.targetCollection.name)
      })
    })

    describe('targetCollection is not present', () => {
      beforeEach(() => {
        props.targetCollection = null
        render()
      })

      it('sets the button text to Organization', () => {
        expect(wrapper.children().text()).toEqual('Organization')
      })
    })
  })
})
