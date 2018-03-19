import PropTypes from 'prop-types'
import AutosizeInput from 'react-input-autosize'
import styled from 'styled-components'
import _ from 'lodash'

import v from '~/utils/variables'
import H1 from '~/ui/global/H1'
import ClickWrapper from '~/ui/layout/ClickWrapper'

const StyledName = styled.div`
  display: inline-block;
`
StyledName.displayName = 'StyledName'

const StyledEditableName = styled.div`
  display: inline-block;
  .input__name {
    width: 30vw;
    margin-bottom: 0.5rem;
    margin-top: 0.5rem;
    input {
      z-index: ${v.zIndex.aboveClickWrapper};
      position: relative;
      font-size: 2.25rem;
      font-family: 'Gotham';
      letter-spacing: 0.125rem;
      padding: 0.15rem 0 0.5rem 0;
      background-color: transparent;
      border-left: none;
      border-top: none;
      border-right: none;
      border-bottom: 1px solid ${v.colors.blackLava};
      &:focus {
        outline: 0;
      }
    }
  }
`
StyledEditableName.displayName = 'StyledEditableName'

class EditableName extends React.Component {
  constructor(props) {
    super(props)
    this.saveName = _.debounce(this._saveName, 1000)
    this.state = {
      name: props.name,
      editing: props.editing,
    }
  }

  onNameFieldKeypress = (e) => {
    if (e.key === 'Enter') {
      this.stopEditingName()
    }
  }

  onNameChange = (e) => {
    const name = e.target.value
    this.setState({ name }, () => this.saveName())
  }

  startEditingName = (e) => {
    e.stopPropagation()
    this.setState({ editing: true })
  }

  stopEditingName = () => {
    // Ensure that save is called if user presses enter
    this.saveName.flush()
    this.setState({ editing: false })
  }

  _saveName = () => {
    const { updateNameHandler } = this.props
    const { name } = this.state
    updateNameHandler(name)
  }

  render() {
    const { viewOnly } = this.props
    const { name, editing } = this.state
    if (!viewOnly && editing) {
      const clickHandlers = [
        () => this.stopEditingName()
      ]
      return (
        <StyledEditableName>
          <AutosizeInput
            className="input__name"
            style={{ fontSize: '2.25rem' }}
            value={name}
            onChange={this.onNameChange}
            onKeyPress={this.onNameFieldKeypress}
          />
          <ClickWrapper clickHandlers={clickHandlers} />
        </StyledEditableName>
      )
    }
    return (
      <StyledName>
        <H1
          onClick={!viewOnly && this.startEditingName}
        >{name}</H1>
      </StyledName>
    )
  }
}

EditableName.propTypes = {
  name: PropTypes.string.isRequired,
  updateNameHandler: PropTypes.func.isRequired,
  editing: PropTypes.bool,
  viewOnly: PropTypes.bool,
}

EditableName.defaultProps = {
  editing: false,
  viewOnly: false
}

export default EditableName
