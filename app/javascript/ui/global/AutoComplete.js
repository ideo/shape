import _ from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from 'material-ui/styles'
import Input from 'material-ui/Input'
import Chip from 'material-ui/Chip'
import Select from 'react-select'
import 'react-select/dist/react-select.css'

import { AutocompleteOption as Option } from '~/ui/global/AutocompleteOption'

function SelectWrapped(props) {
  const { classes, ...other } = props

  return (
    <Select.AsyncCreatable
      optionComponent={Option}
      noResultsText={'No results found'}
      valueComponent={valueProps => {
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
      }}
      {...other}
    />
  )
}

SelectWrapped.propTypes = {
  classes: PropTypes.shape({
    root: PropTypes.string,
    chip: PropTypes.string,
    '@global': PropTypes.string,
  }).isRequired,
}

const ITEM_HEIGHT = 48

const styles = theme => ({
  root: {
    flexGrow: 1,
    height: 220,
  },
  chip: {
    margin: theme.spacing.unit / 4,
    paddingBottom: 0,
    paddingLeft: '4px',
    paddingRight: '4px',
    paddingTop: 0,
  },
  // We had to use a lot of global selectors in order to style react-select.
  // We are waiting on https://github.com/JedWatson/react-select/issues/1679
  // to provide a better implementation.
  // Also, we had to reset the default style injected by the library.
  '@global': {
    '.Select-control': {
      width: '370px',
      display: 'flex',
      alignItems: 'center',
      border: 0,
      height: 'auto',
      background: 'transparent',
      '&:hover': {
        boxShadow: 'none',
      },
    },
    '.Select-multi-value-wrapper': {
      flexGrow: 1,
      display: 'flex',
      flexWrap: 'wrap',
    },
    '.Select--multi .Select-input': {
      width: '370px',
      margin: 0,
    },
    '.Select-noresults': {
      padding: theme.spacing.unit * 2,
    },
    '.Select-input': {
      display: 'inline-flex !important',
      padding: 0,
      height: 'auto',
      width: '370px',
    },
    '.Select-input input': {
      background: 'transparent',
      border: 0,
      padding: 0,
      cursor: 'default',
      display: 'inline-block',
      fontFamily: 'inherit',
      fontSize: 'inherit',
      margin: 0,
      outline: 0,
      width: '370px',
    },
    '.Select-placeholder, .Select--single .Select-value': {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      padding: 0,
    },
    '.Select-placeholder': {
      opacity: 0.42,
      color: theme.palette.common.black,
    },
    '.Select-menu-outer': {
      backgroundColor: 'white',
      border: 'none',
      boxShadow: 'none',
      position: 'absolute',
      left: 0,
      top: `calc(100% + ${theme.spacing.unit}px)`,
      width: '370px',
      zIndex: 2,
      maxHeight: ITEM_HEIGHT * 3.5,
    },
    '.Select.is-focused:not(.is-open) > .Select-control': {
      boxShadow: 'none',
    },
    '.Select-menu': {
      maxHeight: ITEM_HEIGHT * 3.5,
      overflowY: 'auto',
      width: '100%',
    },
    '.Select-menu div': {
      boxSizing: 'content-box',
    },
    '.Select-arrow-zone, .Select-clear-zone': {
      color: theme.palette.action.active,
      cursor: 'pointer',
      height: 21,
      width: 21,
      zIndex: 1,
    },
    // Only for screen readers. We can't use display none.
    '.Select-aria-only': {
      position: 'absolute',
      overflow: 'hidden',
      clip: 'rect(0 0 0 0)',
      height: 1,
      width: 1,
      margin: -1,
    },
  },
})

class AutoComplete extends React.Component {
  constructor(props) {
    super(props)
    this.fireInputChange = _.throttle(this._fireInputChange, 50)
  }

  state = {
    multi: null,
    options: [],
  }

  handleChange = (multi) => {
    this.setState({
      multi,
    })
    let fullOption = this.state.options.find((option) =>
      option.value === multi)
    if (!fullOption || !fullOption.data) {
      fullOption = Object.assign({}, { data: { custom: fullOption.value } })
    }
    this.props.onOptionSelect(fullOption.data)
  }

  _fireInputChange = input => {
    if (!input) {
      return Promise.resolve({ options: [] })
    }
    return this.props.onInputChange(input).then((results) => {
      this.setState({
        options: results
      })
      return { options: results }
    })
  }

  render() {
    const { classes, keepSelectedOptions } = this.props
    const { multi, options } = this.state

    return (
      <div className={classes.root}>
        <Input
          inputComponent={SelectWrapped}
          inputProps={{
            classes,
            multi: true,
            value: keepSelectedOptions ? multi : null,
            options,
            onChange: this.handleChange,
            placeholder: 'email address or username',
            instanceId: 'react-select-chip',
            id: 'react-select-chip',
            name: 'react-select-chip',
            promptTextCreator: label => `Invite email ${label}`,
            simpleValue: true,
            loadOptions: this.fireInputChange,
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
  onOptionSelect: PropTypes.func.isRequired,
  onInputChange: PropTypes.func,
  keepSelectedOptions: PropTypes.bool,
}

AutoComplete.defaultProps = {
  onSelect: () => {},
  onInputChange: () => {},
  keepSelectedOptions: false,
}

export default withStyles(styles)(AutoComplete)
