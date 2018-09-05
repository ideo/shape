import CollectionCreator from '~/ui/grid/blankContentTool/CollectionCreator'

const e = { preventDefault: jest.fn() }
let wrapper, props, component
describe('MovableGridCard', () => {
  beforeEach(() => {
    props = {
      loading: false,
      type: 'collection',
      createCard: jest.fn(),
      closeBlankContentTool: jest.fn()
    }
    props.createCard.mockClear()
    wrapper = shallow(
      <CollectionCreator {...props} />
    )
    component = wrapper.instance()
  })

  it('renders a BctTextField', () => {
    expect(wrapper.find('BctTextField').props().placeholder).toEqual('Collection name')
    expect(wrapper.find('BctTextField').props().autoFocus).toBeTruthy()
  })

  describe('createCollection', () => {
    it('calls createCard with input name', () => {
      component.state = {
        inputText: 'New Projects',
      }
      component.createCollection(e)
      expect(props.createCard).toHaveBeenCalledWith({
        collection_attributes: {
          name: component.state.inputText,
          master_template: false,
          type: null,
        },
      }, {
        afterCreate: null,
      })
    })

    describe('with SubmissionBox', () => {
      beforeEach(() => {
        props.type = 'submissionBox'
        props.createCard.mockClear()
        wrapper = shallow(
          <CollectionCreator {...props} />
        )
        component = wrapper.instance()
      })

      it('calls createCard with input name', () => {
        component.state = {
          inputText: 'Challenge #1',
        }
        component.createCollection(e)
        expect(props.createCard).toHaveBeenCalledWith({
          collection_attributes: {
            name: component.state.inputText,
            master_template: false,
            type: 'Collection::SubmissionBox',
          },
        }, {
          afterCreate: expect.any(Function),
        })
      })
    })

    describe('with TestCollection', () => {
      beforeEach(() => {
        props.type = 'testCollection'
        props.createCard.mockClear()
        wrapper = shallow(
          <CollectionCreator {...props} />
        )
        component = wrapper.instance()
      })

      it('calls createCard with input name', () => {
        component.state = {
          inputText: 'My New Test',
        }
        component.createCollection(e)
        expect(props.createCard).toHaveBeenCalledWith({
          collection_attributes: {
            name: component.state.inputText,
            master_template: false,
            type: 'Collection::TestCollection',
          },
        }, {
          afterCreate: null,
        })
      })
    })
  })
})
