import _ from 'lodash'
import PropTypes from 'prop-types'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observe, observable, runInAction } from 'mobx'

import { Checkbox } from '~/ui/global/styled/forms'
import SearchButton from '~/ui/global/SearchButton'

@inject('routingStore', 'uiStore') // needed for routeTo method
@observer
class GlobalSearch extends React.Component {
  @observable
  searchArchived = false
  @observable
  open = false

  constructor(props) {
    super(props)
    this.search = _.debounce(this._search, 300)
    runInAction(() => {
      this.open = !!this.props.uiStore.searchText
      if (props.alwaysOpen) this.open = true
      // Toggle the search archived checkbox on if the URL param for it is there.
      if (props.routingStore.extraSearchParams.show_archived)
        this.searchArchived = true
    })

    this.disposers = {}
    this.disposers.isSearch = observe(
      props.routingStore,
      'isSearch',
      change => {
        runInAction(() => {
          this.open = change.newValue
        })
      }
    )
  }

  get searchText() {
    return this.props.uiStore.searchText
  }

  _search = query => {
    if (!query) return this.clearSearch()
    const { routingStore } = this.props
    const params = {}
    if (this.searchArchived) {
      params.show_archived = true
    }
    return routingStore.routeTo('search', query, params)
  }

  updateSearchText = text => {
    this.props.uiStore.update('searchText', text)
    // perform a debounced search
    this.search(this.searchText)
  }

  onToggle = val => {
    if (val) {
      // Timeout for animation of opening and closing search bar
      setTimeout(() => {
        runInAction(() => {
          this.open = val
        })
      }, 250)
    } else {
      runInAction(() => {
        this.open = val
      })
    }
  }

  handleTextChange = value => {
    this.updateSearchText(value)
  }

  handleArchivedToggle = value => {
    runInAction(() => {
      this.searchArchived = !this.searchArchived
    })
    this.search(this.searchText)
  }

  clearSearch = () => {
    this.props.routingStore.leaveSearch()
  }

  render() {
    const { routingStore } = this.props
    return (
      <div>
        <SearchButton
          background="white"
          defaultOpen={this.open}
          open={this.open}
          controlled={true}
          focused={routingStore.pathContains('/search')}
          value={this.searchText}
          onChange={this.handleTextChange}
          onClear={this.clearSearch}
          onToggle={this.onToggle}
        />
        {this.open && (
          <div
            style={{
              zIndex: '0',
              marginLeft: '8px',
              position: 'absolute',
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={this.searchArchived}
                  onChange={this.handleArchivedToggle}
                />
              }
              label="search deleted content"
            />
          </div>
        )}
      </div>
    )
  }
}

GlobalSearch.wrappedComponent.propTypes = {
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

GlobalSearch.propTypes = {
  alwaysOpen: PropTypes.bool,
}

GlobalSearch.defaultProps = {
  alwaysOpen: false,
}

export default GlobalSearch
