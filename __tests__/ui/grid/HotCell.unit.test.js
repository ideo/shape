import localStorage from 'mobx-localstorage'

import HotCell, {
  HOT_CELL_DEFAULT_ITEM_TYPE,
  HOT_CELL_DEFAULT_COLLECTION_TYPE,
} from '~/ui/grid/HotCell'
import HotCellQuadrant from '~/ui/grid//HotCellQuadrant'

import { fakeCollection } from '#/mocks/data'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

jest.mock('mobx-localstorage')

let component, localStorageStore, wrapper, apiStore, uiStore

describe('Hotcell', () => {
  const orgTemplate = { ...fakeCollection, id: 87, name: 'our template' }
  const userTemplate = { ...fakeCollection, id: 88, name: 'my template' }
  let rerender
  let props = {}

  beforeEach(() => {
    localStorageStore = {}
    localStorage.setItem = (key, val) => {
      localStorageStore[key] = val
    }
    localStorage.getItem = key => localStorageStore[key]
    localStorage.clear()

    apiStore = fakeApiStore()
    uiStore = fakeUiStore
    apiStore.currentUser.mostUsedTemplateCollections = [userTemplate]
    apiStore.currentOrganization.most_used_templates = [orgTemplate]
    props = {
      apiStore,
      uiStore,
      handleRemoveRowClick: jest.fn(),
      handleInsertRowClick: jest.fn(),
      onCreateContent: jest.fn(),
      onCloseHtc: jest.fn(),
      zoomLevel: 1,
    }
    rerender = (opts = {}) => {
      const newProps = { ...props, ...opts }
      wrapper = shallow(<HotCell.wrappedComponent {...newProps} />)
      component = wrapper.instance()
    }
    rerender()
  })

  describe('render()', () => {
    let quadrants

    beforeEach(() => {
      rerender()
      quadrants = wrapper.find(HotCellQuadrant)
    })

    it('should render the default wrapper', () => {
      expect(wrapper.find('DefaultWrapper').exists()).toBe(true)
    })

    it('should render 4 quadrants', () => {
      expect(quadrants.length).toEqual(4)
      const names = quadrants.map(q => q.props().name)
      expect(names).toEqual(['text', 'file', 'collection', 'template'])
    })

    it('should render the org or user templates in the template menu', () => {
      const templateQuadrant = wrapper.find(HotCellQuadrant).at(3)
      const templates = templateQuadrant.props().subTypes
      expect(templates).toEqual(
        expect.arrayContaining([
          expect.objectContaining(component.collectionIntoQudrant(orgTemplate)),
          expect.objectContaining(
            component.collectionIntoQudrant(userTemplate)
          ),
        ])
      )
    })

    describe('when a different item type is set in local storage', () => {
      beforeEach(() => {
        localStorage.setItem(HOT_CELL_DEFAULT_ITEM_TYPE, 'link')
        rerender()
      })

      it('should have that item as the default item type', () => {
        const itemQuadrant = wrapper.find(HotCellQuadrant).at(1)
        expect(itemQuadrant.props().name).toEqual('link')
      })
    })

    describe('when a different collection type is set in local storage', () => {
      beforeEach(() => {
        localStorage.setItem(HOT_CELL_DEFAULT_COLLECTION_TYPE, 'submissionBox')
        rerender()
      })

      it('should have that item as the default item type', () => {
        const collectionQuadrant = wrapper.find(HotCellQuadrant).at(2)
        expect(collectionQuadrant.props().name).toEqual('submissionBox')
      })
    })
  })

  describe('onCreateContent()', () => {
    const opts = {}

    beforeEach(() => {
      localStorage.setItem(HOT_CELL_DEFAULT_COLLECTION_TYPE, 'collection')
      rerender()
      component.onCreateContent('foamcoreBoard', opts)
    })

    it('calls the onCreateContent prop', () => {
      expect(props.onCreateContent).toHaveBeenCalled()
      expect(props.onCreateContent).toHaveBeenCalledWith('foamcoreBoard', opts)
    })

    it('sets the default item or collection type in local storage', () => {
      const defaultCollectionType = localStorage.getItem(
        HOT_CELL_DEFAULT_COLLECTION_TYPE
      )
      expect(defaultCollectionType).toEqual('foamcoreBoard')
    })
  })

  describe('onTemplateSearch()', () => {
    beforeEach(() => {
      component.onTemplateSearch([1, 2, 3, 4, 5, 6])
    })

    it('should take the first 5 template results', () => {
      expect(component.templateSearchResults).toEqual([1, 2, 3, 4, 5])
    })
  })
})
