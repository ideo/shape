import CollectionCreator from '~/ui/grid/blankContentTool/CollectionCreator'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'
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
    wrapper = shallow(<CollectionCreator {...props} />)
    component = wrapper.instance()
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  it('renders a BctTextField', () => {
    expect(wrapper.find('BctTextField').props().placeholder).toEqual(
      'Collection name'
    )
    expect(wrapper.find('BctTextField').props().autoFocus).toBeTruthy()
  })

  describe('createCollection', () => {
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
        wrapper = shallow(<CollectionCreator {...props} />)
        component = wrapper.instance()
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
        wrapper = shallow(<CollectionCreator {...props} />)
        component = wrapper.instance()
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
        wrapper = shallow(<CollectionCreator {...props} />)
        component = wrapper.instance()
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
        wrapper = shallow(<CollectionCreator {...props} />)
        component = wrapper.instance()
      })

      it('creates a template collection', () => {
        component.createCollection(e)
        expect(component.shouldCreateAsSubTemplate).toBeTruthy()
      })
    })

    describe('when a viewing collection is a master template', () => {
      beforeEach(() => {
        props.uiStore.viewingCollection.isTemplate = true
        props.createCard.mockClear()
        wrapper = shallow(<CollectionCreator {...props} />)
        component = wrapper.instance()
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
