import LegendItemCover from '~/ui/grid/covers/LegendItemCover'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import {
  fakeDataset,
  fakeLegendItem,
  fakeLegendItemCard,
  fakeCollection,
} from '#/mocks/data'

let wrapper, instance, props
const parentCollection = fakeCollection
describe('LegendItemCover', () => {
  beforeEach(() => {
    render = () => {
      props = {
        item: fakeLegendItem,
        card: {
          ...fakeLegendItemCard,
          parentCollection,
        },
        apiStore: fakeApiStore(),
        uiStore: fakeUiStore,
      }
      props.item.can_edit_content = true
      wrapper = shallow(<LegendItemCover.wrappedComponent {...props} />)
      instance = wrapper.instance()
    }
    render()
  })

  it('shows selected dataset', () => {
    const selectedMeasure = wrapper.find('Dataset').at(0)
    expect(selectedMeasure.exists()).toBe(true)
  })

  describe('when it has style', () => {
    beforeEach(() => {
      props.item.primaryDataset.style = { fill: 'red' }
      props.item.style = { fill: 'blue' }
      render()
    })

    it('should override dataset fill style with its own', () => {
      const fillColor = wrapper
        .find('AreaChartIcon')
        .first()
        .props().color
      expect(fillColor).toEqual('blue')
    })
  })

  describe('unselect', () => {
    const getUnselect = () => {
      return wrapper
        .find('Dataset')
        .at(1)
        .find('UnselectDataset')
    }

    beforeEach(() => {})

    describe('when unselecting a grouped dataset', () => {
      beforeEach(() => {
        props.item.datasets = [
          fakeDataset,
          {
            ...fakeDataset,
            groupings: [{ type: 'Organization', id: 13 }],
            selected: true,
            identifier: 'org-wide-question',
            name: 'Organization stuff',
          },
        ]
        render()
        getUnselect().simulate('click')
      })

      it('should unselect the dataset by identifier', () => {
        expect(
          parentCollection.API_unselectDatasetsWithIdentifier
        ).toHaveBeenCalled()
      })
    })

    describe('when unselecting a dataset in legend with select_from_datasets search source', () => {
      beforeEach(() => {
        props.item.legend_search_source = 'select_from_datasets'
        props.item.datasets = [
          fakeDataset,
          {
            ...fakeDataset,
            groupings: [],
            selected: true,
            identifier: 'creative-difference-purpose',
            name: 'Purpose',
          },
        ]
        render()
        getUnselect().simulate('click')
      })

      it('should unselect the dataset by identifier', () => {
        expect(
          parentCollection.API_unselectDatasetsWithIdentifier
        ).toHaveBeenCalled()
      })
    })

    describe('when unselecting a test dataset', () => {
      beforeEach(() => {
        props.item.datasets = [
          fakeDataset,
          {
            ...fakeDataset,
            // Set order to something other than 0, ore else it is primary and can't be unselected
            order: 1,
            groupings: [],
            selected: true,
            name: 'something-else',
            identifier: 'Something Else',
            test_collection_id: parentCollection.id,
          },
        ]
        render()
        getUnselect().simulate('click')
      })

      it('should remove the comparison', () => {
        expect(parentCollection.API_removeComparison).toHaveBeenCalled()
      })
    })
  })

  describe('datasets()', () => {
    beforeEach(() => {
      const datasetSelectedA = {
        ...fakeDataset,
        identifier: 'a',
        selected: true,
      }
      const datasetSelectedB = {
        ...fakeDataset,
        identifier: 'b',
        selected: true,
      }
      const datasetUnselectedC = {
        ...fakeDataset,
        identifier: 'c',
        selected: false,
      }
      const datasetDuplicatedA = {
        ...fakeDataset,
        identifier: 'a',
        selected: true,
      }
      props.item.datasets = [
        datasetSelectedA,
        datasetSelectedB,
        datasetUnselectedC,
        datasetDuplicatedA,
      ]
      render()
    })

    it('should filter by selected datasets', () => {
      expect(instance.datasets({ selected: true }).length).toEqual(2)
      expect(instance.datasets({ selected: false }).length).toEqual(1)
    })

    it('should filter out duplicates by identifier', () => {
      expect(instance.datasets({ selected: true }).length).toEqual(2)
    })
  })

  describe('toggle comparison search', () => {
    const comparisonClick = () => {
      wrapper.find('.test-add-comparison-button').simulate('click')
    }

    it('should remove/open the empty space click handler', () => {
      comparisonClick()
      expect(props.uiStore.addEmptySpaceClickHandler).toHaveBeenCalled()
    })

    it('should set the comparison menu open state', () => {
      comparisonClick()
      expect(wrapper.state().comparisonMenuOpen).toBe(true)
    })
  })

  describe('onSelectComparison', () => {
    let groupedDataset

    beforeEach(() => {
      groupedDataset = {
        ...fakeDataset,
        groupings: [{ type: 'Organization', id: 13 }],
        selected: false,
        identifier: 'org-wide-question',
        name: 'Organization stuff',
        internalType: 'datasets',
        test_collection_id: parentCollection.id,
      }
      props.item.datasets = [groupedDataset]
      render()
    })

    describe('with a test collection', () => {
      it('should add the test comparison with the test', () => {
        instance.onSelectComparison(fakeCollection)
        expect(parentCollection.API_addComparison).toHaveBeenCalled()
      })
    })

    describe('with a dataset', () => {
      it('should toggle the dataset with name', () => {
        instance.onSelectComparison(groupedDataset)
        expect(
          parentCollection.API_selectDatasetsWithIdentifier
        ).toHaveBeenCalled()
        expect(parentCollection.API_fetchCard).toHaveBeenCalledWith(
          fakeLegendItem.parent_collection_card.id
        )
        expect(parentCollection.reloadDataItemsDatasets).toHaveBeenCalled()
      })
    })
  })

  describe('without edit access', () => {
    beforeEach(() => {
      props.item.can_edit_content = false
      wrapper = shallow(<LegendItemCover.wrappedComponent {...props} />)
    })

    it('should show the comparison button', () => {
      expect(wrapper.find('.test-add-comparison-button').exists()).toBe(true)
    })
  })
})
