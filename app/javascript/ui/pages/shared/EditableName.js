import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import AutosizeInput from 'react-input-autosize'
import styled from 'styled-components'
import _ from 'lodash'

import v from '~/utils/variables'
import H1 from '~/ui/global/H1'
import ClickWrapper from '~/ui/layout/ClickWrapper'

const StyledName = styled.div`
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
      letter-spacing: 2px;
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

@inject('uiStore')
@observer
class EditableName extends React.Component {
  constructor(props) {
    super(props)
    this.saveName = _.debounce(this.saveName, 1000)
    this.state = {
      name: props.name,
    }
  }

  onNameFieldKeypress = (e) => {
    if (e.key === 'Enter') {
      const { uiStore } = this.props
      uiStore.stopEditingObjectName()
    }
  }

  onNameChange = (e) => {
    const name = e.target.value
    this.setState({ name })
    this.saveName()
  }

  startEditingName = (e) => {
    e.stopPropagation()
    const { uiStore } = this.props
    uiStore.startEditingObjectName()
  }

  saveName = () => {
    const { updateNameHandler } = this.props
    const { name } = this.state
    updateNameHandler(name)
  }

  render() {
    const { name } = this.state
    const { editingObjectName } = this.props.uiStore
    if (editingObjectName) {
      const clickHandlers = [
        () => this.props.uiStore.stopEditingObjectName()
      ]
      return (
        <StyledName>
          <AutosizeInput
            className="input__name"
            style={{ fontSize: '2.25rem' }}
            value={name}
            onChange={this.onNameChange}
            onKeyPress={this.onNameFieldKeypress}
          />
          <ClickWrapper
            clickHandlers={clickHandlers}
            zIndex={900}
          />
        </StyledName>
      )
    }
    return (
      <StyledName>
        <H1 onClick={this.startEditingName}>{name}</H1>
      </StyledName>
    )
  }
}

EditableName.wrappedComponent.propTypes = {
  name: PropTypes.string.isRequired,
  updateNameHandler: PropTypes.func.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default EditableName
