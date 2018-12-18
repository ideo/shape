import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { withStyles, withTheme } from '@material-ui/core/styles'
import AsyncSelect from 'react-select/lib/Async'
import Input from '@material-ui/core/Input'
import Chip from '@material-ui/core/Chip'
import AsyncCreatable from 'react-select/lib/AsyncCreatable'
import Select from 'react-select'
import { pick } from 'lodash'

import Option from '~/ui/global/AutocompleteOption'
import SearchIcon from '~/ui/icons/SearchIcon'
import { uiStore } from '~/stores'

const SearchIconContainer = styled.span`
  display: block;
  left: 0;
  position: absolute;
  width: 14px;
  top: 14px;

  .icon {
    width: 22px;
  }
`

const DropdownIndicator = () => (
  <SearchIconContainer>
    <SearchIcon />
  </SearchIconContainer>
)

const valueComponent = classes => valueProps => {
  const { value, children, onRemove } = valueProps

  const onDelete = event => {
    event.preventDefault()
    event.stopPropagation()
    onRemove(value)
  }

  if (onRemove) {
    return (
      <Chip
        tabIndex={-1}
        label={children}
        className={classes.chip}
        onDelete={onDelete}
      />
    )
  }

  return <div className="Select-value">{children}</div>
}

const ITEM_HEIGHT = 48

const selectStyles = theme => ({
  clearIndicator: () => ({}),
  container: () => ({}),
  control: () => ({
    width: '370px',
    paddingLeft: '24px',
    display: 'flex',
    alignItems: 'center',
    border: 0,
    height: 'auto',
    background: 'transparent',
    '&:hover': {
      boxShadow: 'none',
    },
  }),
  dropdownIndicator: () => ({}),
  group: () => ({}),
  groupHeading: () => ({}),
  indicatorsContainer: () => ({}),
  indicatorSeparator: () => ({}),
  input: base => ({
    ...base,
  }),
  loadingIndicator: () => ({}),
  loadingMessage: () => ({}),
  menu: base => ({
    ...pick(base, ['position', 'width', 'zIndex']),
    backgroundColor: 'white',
    top: `calc(100% + ${theme.spacing.unit}px)`,
    width: '370px',
    zIndex: 2,
  }),
  menuList: base => ({
    ...base,
    maxHeight: `${ITEM_HEIGHT * 3.5}px`,
  }),
  multiValue: () => ({}),
  multiValueLabel: () => ({}),
  multiValueRemove: () => ({}),
  noOptionsMessage: () => ({
    padding: theme.spacing.unit * 2,
  }),
  option: (base, state) => ({
    ...base,
    '&:hover': {
      background: state.isFocused ? '#DDD' : '#EEE',
    },
    background: state.isFocused ? '#DDD' : '',
  }),
  placeholder: base => ({
    ...base,
  }),
  singleValue: () => ({}),
  valueContainer: () => ({}),
})

const SelectWrapped = props => {
  const { classes, theme, creatable, options, optionSearch, ...other } = props
  if (optionSearch && !creatable) {
    // Option search will do an async search for options.
    return (
      <AsyncSelect
        loadOptions={optionSearch}
        defaultOptions
        styles={selectStyles(theme)}
        components={{
          valueComponent: valueComponent(classes),
          DropdownIndicator,
          Option,
        }}
        {...other}
      />
    )
  }
  return optionSearch && creatable ? (
    <AsyncCreatable
      loadOptions={optionSearch}
      defaultOptions
      styles={selectStyles(theme)}
      formatCreateLabel={inputValue => `Invite email ${inputValue}`}
      components={{
        valueComponent: valueComponent(classes),
        DropdownIndicator,
        Option,
      }}
      noOptionsMessage={() => {
        uiStore.autocompleteMenuClosed()
        return 'No results found'
      }}
      onMenuClose={() => uiStore.autocompleteMenuClosed()}
      options={options}
      {...other}
    />
  ) : (
    <Select
      styles={selectStyles(theme)}
      components={{
        valueComponent: valueComponent(classes),
        DropdownIndicator,
        Option,
      }}
      options={options}
      {...other}
    />
  )
}

const styles = theme => ({
  root: {
    flexGrow: 1,
    height: 30,
  },
  chip: {
    margin: theme.spacing.unit / 4,
    paddingBottom: 0,
    paddingLeft: '4px',
    paddingRight: '4px',
    paddingTop: 0,
  },
})

const SelectWrappedWithStyles = withTheme()(SelectWrapped)

SelectWrapped.propTypes = {
  classes: PropTypes.shape({
    root: PropTypes.string,
    chip: PropTypes.string,
    '@global': PropTypes.string,
  }).isRequired,
}

class AutoComplete extends React.Component {
  state = {
    option: this.props.options.find(x => x.value === this.props.value),
  }

  handleChange = option => {
    uiStore.autocompleteMenuClosed()
    this.setState({
      option,
    })
    let fullOption = option
    if (this.props.options && this.props.options.length) {
      fullOption = this.props.options.find(x => x === option)
    }
    if (!fullOption || !fullOption.data) {
      fullOption = Object.assign({}, { data: { custom: option.value } })
    }
    this.props.onOptionSelect(fullOption.data)
  }

  render() {
    const {
      classes,
      keepSelectedOptions,
      options,
      optionSearch,
      placeholder,
      creatable,
    } = this.props
    const { option } = this.state
    return (
      <div className={classes.root}>
        <Input
          inputComponent={SelectWrappedWithStyles}
          inputProps={{
            classes,
            multi: true,
            value: keepSelectedOptions ? option : null,
            options,
            optionSearch,
            onChange: this.handleChange,
            placeholder,
            creatable,
            instanceId: 'react-select-chip',
            id: 'react-select-chip',
            name: 'react-select-chip',
            promptTextCreator: label => `Invite email ${label}`,
            simpleValue: true,
          }}
        />
      </div>
    )
  }
}

AutoComplete.propTypes = {
  classes: PropTypes.shape({
    root: PropTypes.string,
    chip: PropTypes.string,
    '@global': PropTypes.string,
  }).isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string,
    })
  ).isRequired,
  onOptionSelect: PropTypes.func.isRequired,
  optionSearch: PropTypes.func,
  keepSelectedOptions: PropTypes.bool,
  placeholder: PropTypes.string,
  creatable: PropTypes.bool,
  value: PropTypes.number,
}

AutoComplete.defaultProps = {
  onSelect: () => {},
  keepSelectedOptions: false,
  creatable: false,
  placeholder: '',
  value: undefined,
  optionSearch: null,
}

export default withStyles(styles)(AutoComplete)
