import PropTypes from 'prop-types'
import AutosizeInput from 'react-input-autosize'
import styled from 'styled-components'
import _ from 'lodash'

import v from '~/utils/variables'
import { Heading1 } from '~/ui/global/styled/typography'
import ClickWrapper from '~/ui/layout/ClickWrapper'

const StyledName = styled.div`
  h1 {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`
StyledName.displayName = 'StyledName'

const StyledEditableName = styled.div`
  display: inline-block;
  .input__name {
    width: ${props => props.fontSize > 2 ? '30vw' : 'auto'};
    margin-bottom: 0.5rem;
    margin-top: 0.5rem;
    input {
      z-index: ${v.zIndex.aboveClickWrapper};
      position: relative;
      font-size: ${props => props.fontSize}rem;
      font-family: ${v.fonts.sans};
      font-weight: ${v.weights.medium};
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

  // navigating between collections may trigger this instead of didMount
  componentWillReceiveProps(nextProps) {
    this.setState({
      name: nextProps.name,
      editing: nextProps.editing,
    })
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
    const { canEdit, TextWrapper, fontSize } = this.props
    const { name, editing } = this.state
    if (canEdit && editing) {
      const clickHandlers = [
        () => this.stopEditingName()
      ]
      return (
        <StyledEditableName fontSize={fontSize}>
          <AutosizeInput
            maxLength={40}
            className="input__name"
            style={{ fontSize }}
            value={name}
            onChange={this.onNameChange}
            onKeyPress={this.onNameFieldKeypress}
          />
          <ClickWrapper clickHandlers={clickHandlers} />
        </StyledEditableName>
      )
    }
    let nameEl = (
      <Heading1 onClick={canEdit ? this.startEditingName : null}>
        {name}
      </Heading1>
    )
    if (TextWrapper) {
      nameEl = (
        <button onClick={canEdit ? this.startEditingName : null}>
          <TextWrapper>{name}</TextWrapper>
        </button>
      )
    }
    return (
      <StyledName>
        {nameEl}
      </StyledName>
    )
  }
}

EditableName.propTypes = {
  name: PropTypes.string.isRequired,
  updateNameHandler: PropTypes.func.isRequired,
  editing: PropTypes.bool,
  canEdit: PropTypes.bool,
  TextWrapper: PropTypes.element,
  fontSize: PropTypes.number,
}

EditableName.defaultProps = {
  editing: false,
  canEdit: false,
  TextWrapper: null,
  fontSize: 2.25,
}

export default EditableName
