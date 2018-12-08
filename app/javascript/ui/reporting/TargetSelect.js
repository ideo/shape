import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import MenuItem from '@material-ui/core/MenuItem'
import trackError from '~/utils/trackError'
import { Select } from '~/ui/global/styled/forms'
import AutoComplete from '~/ui/global/AutoComplete'
import v from '~/utils/variables'

function formatCollections(collections) {
  return collections.map(collection => ({
    value: collection.id,
    label: collection.name,
    data: collection,
  }))
}

@inject('apiStore')
@observer
class TargetSelect extends React.Component {
  @observable
  type = 'Organization'

  componentDidMount() {
    const {
      item: {
        data_settings: { d_filters },
      },
    } = this.props
    if (!d_filters || d_filters.length === 0) return
    runInAction(() => {
      this.type = d_filters[0].type
    })
  }

  async collectionSearch(term) {
    try {
      const res = await this.props.apiStore.searchCollections({
        query: term,
        perPage: 100,
      })
      return formatCollections(res.data)
    } catch (e) {
      trackError(e)
      return []
    }
  }

  onSearch = value => this.collectionSearch(value)

  get currentValue() {
    return this.collectionFilter ? 'Collection' : this.type
  }

  handleChange = e => {
    e.preventDefault()
    const { onSelect } = this.props
    const { value } = e.target
    runInAction(() => (this.type = value))
    if (value === 'Organization') {
      onSelect()
    } else if (this.collectionFilter) {
      onSelect(this.collectionFilter.target)
    }
  }

  get collectionFilter() {
    const { item } = this.props
    return (
      item.data_settings.d_filters &&
      item.data_settings.d_filters.find(x => x.type === 'Collection')
    )
  }

  render() {
    return (
      <form className="form" style={{ display: 'inline-block' }}>
        <Select
          classes={{ root: 'select', selectMenu: 'selectMenu' }}
          displayEmpty
          disableUnderline
          name="role"
          onChange={this.handleChange}
          value={this.currentValue}
          inline
        >
          {['Organization', 'Collection'].map(opt => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </Select>
        {this.type === 'Collection' && (
          <div
            style={{
              display: 'inline-block',
              marginBottom: '10px',
              backgroundColor: v.colors.commonLight,
            }}
          >
            <AutoComplete
              options={[]}
              optionSearch={this.onSearch}
              onOptionSelect={option => this.props.onSelect(option)}
              placeholder="Collection name"
              keepSelectedOptions
              style={{ display: 'inline-block' }}
            />
          </div>
        )}
      </form>
    )
  }
}

TargetSelect.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

TargetSelect.propTypes = {
  item: MobxPropTypes.objectOrObservableObject,
  onSelect: PropTypes.func,
}

TargetSelect.defaultProps = {
  item: null,
  onSelect: null,
}

export default TargetSelect
