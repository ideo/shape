import _ from 'lodash'
import PropTypes from 'prop-types'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observe, observable, runInAction } from 'mobx'
import styled from 'styled-components'

import { Checkbox } from '~/ui/global/styled/forms'
import ExpandableSearchInput from '~/ui/global/ExpandableSearchInput'

const StyledFormControlLabel = styled(FormControlLabel)`
  &.wrapper {
    z-index: 0;
    margin-top: 5px;
    position: absolute;
    margin-left: -4px;
    height: 25px;
  }
`

@inject('routingStore', 'uiStore') // needed for routeTo method
@observer
class GlobalSearch extends React.Component {
  disposers = {}
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

  componentWillUnmount() {
    _.each(this.disposers, disposer => disposer())
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
    if (text.length > 3) {
      // perform a debounced search
      this.search(this.searchText)
    }
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
        <ExpandableSearchInput
          background="white"
          defaultOpen={routingStore.isSearch}
          open={this.open}
          controlled
          value={this.searchText}
          onChange={this.handleTextChange}
          onClear={this.clearSearch}
          onToggle={this.onToggle}
        />
        {this.open && (
          <StyledFormControlLabel
            classes={{ root: 'wrapper' }}
            control={
              <Checkbox
                checked={this.searchArchived}
                onChange={this.handleArchivedToggle}
              />
            }
            label="search deleted content"
          />
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
