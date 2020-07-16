import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { withStyles, withTheme } from '@material-ui/core/styles'
import AsyncSelect from 'react-select/lib/Async'
import Input from '@material-ui/core/Input'
import Chip from '@material-ui/core/Chip'
import AsyncCreatable from 'react-select/lib/AsyncCreatable'
import Select from 'react-select'

import Loader from '~/ui/layout/Loader'
import Option from '~/ui/global/AutocompleteOption'
import SearchIcon from '~/ui/icons/SearchIcon'
import { uiStore } from '~/stores'

const SearchIconContainer = styled.span`
  display: block;
  left: 5px;
  position: absolute;
  width: 14px;
  top: 9px;

  .icon {
    width: 22px;
  }
`
const LoadingContainer = styled(SearchIconContainer)`
  left: auto;
  top: 0;
  right: 30px;
`

const DropdownIndicator = () => (
  <SearchIconContainer>
    <SearchIcon />
  </SearchIconContainer>
)

const LoadingIndicator = () => (
  <LoadingContainer>
    <Loader size={25} containerHeight="30px" />
  </LoadingContainer>
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

const ITEM_HEIGHT = 64

const selectStyles = (theme, menuStyles = {}, numOptionsToShow = 3.5) => ({
  clearIndicator: () => ({}),
  container: () => ({}),
  control: () => ({
    paddingBottom: '3px',
    backgroundColor: 'white',
    marginBottom: '-5px',
    paddingLeft: '24px',
    display: 'flex',
    alignItems: 'center',
    border: 0,
    height: 'auto',
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
  loadingMessage: () => ({
    padding: theme.spacing(2),
  }),
  menu: base => ({
    ...base,
    borderRadius: '0px',
    backgroundColor: 'white',
    ...menuStyles,
  }),
  menuList: base => ({
    ...base,
    maxHeight: `${ITEM_HEIGHT * numOptionsToShow}px`,
  }),
  multiValue: () => ({}),
  multiValueLabel: () => ({}),
  multiValueRemove: () => ({}),
  noOptionsMessage: () => ({
    padding: theme.spacing(2),
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
    paddingTop: '0px',
    paddingBottom: '12px',
  }),
  singleValue: () => ({}),
  valueContainer: () => ({}),
})

const SelectWrapped = props => {
  const {
    classes,
    theme,
    creatable,
    defaultOptions,
    options,
    optionSearch,
    menuPlacement,
    keepMenuClosed,
    menuStyles,
    numOptionsToShow,
    onMenuClose,
    inputRef,
    ...other
  } = props

  React.useImperativeHandle(inputRef, () => ({
    focus: () => {
      // No-op, but this must be implemented for MUI
      // https://material-ui.com/components/text-fields/#integration-with-3rd-party-input-libraries
    },
  }))

  if (keepMenuClosed) {
    other.menuIsOpen = false
  }
  if (optionSearch && !creatable) {
    // Option search will do an async search for options.
    return (
      <AsyncSelect
        loadOptions={optionSearch}
        defaultOptions={defaultOptions}
        menuPlacement={menuPlacement}
        styles={selectStyles(theme, menuStyles, numOptionsToShow)}
        onMenuClose={onMenuClose}
        components={{
          valueComponent: valueComponent(classes),
          LoadingIndicator,
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
      styles={selectStyles(theme, menuStyles, numOptionsToShow)}
      formatCreateLabel={inputValue => `Invite email ${inputValue}`}
      menuPlacement={menuPlacement}
      components={{
        valueComponent: valueComponent(classes),
        LoadingIndicator,
        DropdownIndicator,
        Option,
      }}
      noOptionsMessage={() => {
        uiStore.autocompleteMenuClosed()
        return 'No results found'
      }}
      onMenuClose={() => {
        uiStore.autocompleteMenuClosed()
        onMenuClose()
      }}
      options={options}
      {...other}
    />
  ) : (
    <Select
      styles={selectStyles(theme, menuStyles, numOptionsToShow)}
      menuPlacement={menuPlacement}
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
    backgroundColor: 'white',
    flexGrow: 1,
    height: 30,
    paddingTop: '8px',
    paddingBottom: '8px',
    width: '100%',
  },
  chip: {
    margin: theme.spacing(0.25),
    paddingBottom: 0,
    paddingLeft: '4px',
    paddingRight: '4px',
    paddingTop: 0,
  },
  input: {
    paddingBottom: '20px',
    paddingTop: '0px',
  },
})

const SelectWrappedWithStyles = withTheme(SelectWrapped)

SelectWrapped.propTypes = {
  classes: PropTypes.shape({
    root: PropTypes.string,
    chip: PropTypes.string,
    '@global': PropTypes.string,
    input: PropTypes.string,
  }).isRequired,
}

class AutoComplete extends React.Component {
  state = {
    option: this.props.options.find(x => x.value === this.props.value),
    inputValue: '',
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

  handleOnInputChange = (inputValue, action) => {
    if (action.action !== 'input-blur' && action.action !== 'menu-close') {
      this.setState({ inputValue })
    }
  }

  render() {
    const {
      autoFocus,
      classes,
      keepSelectedOptions,
      defaultOptions,
      options,
      optionSearch,
      placeholder,
      menuPlacement,
      keepMenuClosed,
      creatable,
      menuStyles,
      onMenuClose,
      numOptionsToShow,
    } = this.props
    const { option, inputValue } = this.state
    return (
      <div className={classes.root}>
        <Input
          fullWidth
          inputComponent={SelectWrappedWithStyles}
          inputProps={{
            autoFocus,
            classes,
            menuStyles,
            numOptionsToShow,
            multi: true,
            value: keepSelectedOptions ? option : null,
            defaultOptions,
            inputValue,
            options,
            optionSearch,
            onChange: this.handleChange,
            onInputChange: this.handleOnInputChange,
            placeholder,
            creatable,
            menuPlacement,
            keepMenuClosed,
            onMenuClose,
            instanceId: 'react-select-chip',
            id: 'react-select-chip',
            name: 'react-select-chip',
            className: `react-select-chip ${classes.input}`,
            promptTextCreator: label => `Invite email ${label}`,
            simpleValue: true,
          }}
        />
      </div>
    )
  }
}

AutoComplete.propTypes = {
  autoFocus: PropTypes.bool,
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
  defaultOptions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string,
    })
  ),
  onOptionSelect: PropTypes.func.isRequired,
  optionSearch: PropTypes.func,
  keepSelectedOptions: PropTypes.bool,
  placeholder: PropTypes.string,
  creatable: PropTypes.bool,
  value: PropTypes.number,
  menuPlacement: PropTypes.string,
  keepMenuClosed: PropTypes.bool,
  numOptionsToShow: PropTypes.number,
  onMenuClose: PropTypes.func,
  menuStyles: PropTypes.shape({
    width: PropTypes.string,
    zIndex: PropTypes.number,
  }),
}

AutoComplete.defaultProps = {
  autoFocus: false,
  onSelect: () => {},
  keepSelectedOptions: false,
  creatable: false,
  placeholder: '',
  value: undefined,
  options: [],
  defaultOptions: [],
  optionSearch: null,
  menuPlacement: 'bottom',
  keepMenuClosed: false,
  numOptionsToShow: 3.5,
  onMenuClose: () => {},
  menuStyles: {
    width: '370px',
    zIndex: 2,
  },
}

export default withStyles(styles)(AutoComplete)
