import CollectionCreator from '~/ui/grid/blankContentTool/CollectionCreator'
import googleTagManager from '~/vendor/googleTagManager'
import { routingStore } from '~/stores'
import fakeUiStore from '#/mocks/fakeUiStore'

jest.mock('../../../../app/javascript/vendor/googleTagManager')
jest.mock('../../../../app/javascript/stores')
const uiStore = fakeUiStore

uiStore.viewingCollection = {
  id: 3,
  isTemplate: false,
}

const e = { preventDefault: jest.fn() }
let wrapper, props, component
const rerender = () => {
  wrapper = shallow(<CollectionCreator {...props} />)
  component = wrapper.instance()
}
describe('CollectionCreator', () => {
  beforeEach(() => {
    props = {
      loading: false,
      type: 'collection',
      createCard: jest.fn(),
      closeBlankContentTool: jest.fn(),
      uiStore: fakeUiStore,
    }
    props.createCard.mockClear()
    rerender()
  })

  it('renders a BctTextField', () => {
    expect(wrapper.find('BctTextField').props().placeholder).toEqual(
      'Collection name'
    )
    expect(wrapper.find('BctTextField').props().autoFocus).toBeTruthy()
  })

  describe('createCollection', () => {
    it('does not call createCard if state.inputText is blank', () => {
      component.state = {
        inputText: '',
      }
      component.createCollection(e)
      expect(props.createCard).not.toHaveBeenCalled()
    })

    it('calls createCard with input name', () => {
      component.state = {
        inputText: 'New Projects',
      }
      component.createCollection(e)
      expect(props.createCard).toHaveBeenCalledWith(
        {
          collection_attributes: {
            name: component.state.inputText,
            master_template: false,
            type: null,
            // collections are 4 columns by default
            num_columns: 4,
          },
        },
        {
          afterCreate: component.afterCreate,
        }
      )
    })

    describe('when collection is a SubmissionBox', () => {
      beforeEach(() => {
        props.type = 'submissionBox'
        props.createCard.mockClear()
        rerender()
      })

      it('creates a card with submission box type and input text name', () => {
        component.state = {
          inputText: 'Challenge #1',
        }
        component.createCollection(e)
        expect(props.createCard).toHaveBeenCalledWith(
          {
            collection_attributes: {
              name: component.state.inputText,
              master_template: false,
              type: 'Collection::SubmissionBox',
              num_columns: 4,
            },
          },
          {
            afterCreate: component.afterCreate,
          }
        )
      })
    })

    describe('when collection is a FoamcoreBoard', () => {
      beforeEach(() => {
        props.type = 'foamcoreBoard'
        props.createCard.mockClear()
        rerender()
      })

      it('creates a Collection::Board with 16 columns', () => {
        component.state = {
          inputText: 'Ideas Board',
        }
        component.createCollection(e)
        expect(props.createCard).toHaveBeenCalledWith(
          {
            collection_attributes: {
              name: component.state.inputText,
              master_template: false,
              type: 'Collection::Board',
              num_columns: 16,
            },
          },
          {
            afterCreate: component.afterCreate,
          }
        )
      })
    })

    describe('when collection is a SearchColleciton', () => {
      beforeEach(() => {
        props.type = 'search'
        props.createCard.mockClear()
        rerender()
      })

      it('adds the search term to create card', () => {
        component.state = {
          inputText: 'plants',
        }
        component.createCollection(e)
        expect(props.createCard).toHaveBeenCalledWith(
          {
            collection_attributes: {
              name: component.state.inputText,
              master_template: false,
              type: 'Collection::SearchCollection',
              search_term: 'plants',
              num_columns: 4,
            },
          },
          {
            afterCreate: component.afterCreate,
          }
        )
      })
    })

    describe('with TestCollection', () => {
      beforeEach(() => {
        props.type = 'testCollection'
        props.createCard.mockClear()
        rerender()
      })

      it('creates a card with test collection type and input text name', () => {
        component.state = {
          inputText: 'My New Test',
        }
        component.createCollection(e)
        expect(props.createCard).toHaveBeenCalledWith(
          {
            collection_attributes: {
              name: component.state.inputText,
              master_template: false,
              type: 'Collection::TestCollection',
              num_columns: 4,
            },
          },
          {
            afterCreate: component.afterCreate,
          }
        )
      })
    })

    describe('when a collection is Template', () => {
      beforeEach(() => {
        props.type = 'template'
        props.createCard.mockClear()
        rerender()
      })

      it('creates a 4WFC template collection', () => {
        component.state = {
          inputText: 'My New Template',
        }
        component.createCollection(e)
        expect(component.shouldCreateAsSubTemplate).toBeTruthy()
        expect(props.createCard).toHaveBeenCalledWith(
          {
            collection_attributes: {
              name: component.state.inputText,
              master_template: true,
              type: 'Collection::Board',
              num_columns: 4,
            },
          },
          {
            afterCreate: component.afterCreate,
          }
        )
      })
    })

    describe('when a viewing collection is a master template', () => {
      beforeEach(() => {
        props.uiStore.viewingCollection.isTemplate = true
        props.createCard.mockClear()
        rerender()
      })

      it('creates a template collection', () => {
        component.createCollection(e)
        expect(component.shouldCreateAsSubTemplate).toBeTruthy()
      })
    })
  })

  describe('afterCreate', () => {
    describe('when collection is any collection', () => {
      it('pushes an event to google tag manager', () => {
        wrapper.setProps({ type: 'collection' })
        component.afterCreate({})
        expect(googleTagManager.push).toHaveBeenCalledWith({
          event: 'formSubmission',
          formType: 'Create Collection',
        })
      })
    })
    describe('when collection is a submission box', () => {
      it('pushes an event to google tag manager and redirects', () => {
        wrapper.setProps({ type: 'submissionBox' })
        component.afterCreate({
          record: {
            id: 1,
          },
        })

        expect(googleTagManager.push).toHaveBeenCalledWith({
          event: 'formSubmission',
          formType: 'Create Collection::SubmissionBox',
        })
        expect(routingStore.routeTo).toHaveBeenCalledWith('collections', 1)
      })
    })
  })
})
