import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import MenuItem from '@material-ui/core/MenuItem'
import trackError from '~/utils/trackError'
import { Select } from '~/ui/global/styled/forms'
import AutoComplete from '~/ui/global/AutoComplete'

@inject('apiStore')
@observer
class TargetSelect extends React.Component {
  @observable
  type = 'Organization'

  @observable
  collections = []

  async componentWillMount() {
    try {
      const res = await this.props.apiStore.searchCollections({ perPage: 100 })
      runInAction(() => (this.collections = res.data))
    } catch (e) {
      trackError(e)
    }
    runInAction(
      () => (this.type = this.collectionFilter ? 'Collection' : 'Organization')
    )
  }

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
    const selected =
      this.collectionFilter &&
      this.collections.find(
        x => Number(x.id) === Number(this.collectionFilter.target)
      )
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
        {this.type}
        {this.type === 'Collection' && (
          <AutoComplete
            options={this.collections.map(x => ({
              value: x.id,
              label: x.name,
            }))}
            onOptionSelect={option => this.props.onSelect(option.custom)}
            placeholder="Collection name"
            value={selected && selected.id}
            keepSelectedOptions
          />
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
