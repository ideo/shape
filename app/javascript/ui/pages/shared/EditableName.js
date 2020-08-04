import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import PropTypes from 'prop-types'
import AutosizeInput from 'react-input-autosize'
import styled from 'styled-components'
import _ from 'lodash'

import v from '~/utils/variables'
import { Heading1, Heading1TypographyCss } from '~/ui/global/styled/typography'
import ClickWrapper from '~/ui/layout/ClickWrapper'

const StyledName = styled.div`
  display: ${props => (props.inline ? 'inline-block' : 'block')};
  margin-top: 0;
  vertical-align: top;
  color: red;

  .editable-name-heading {
    margin-bottom: 0;
    padding: 0;
  }
`
StyledName.displayName = 'StyledName'

const StyledEditableName = styled.div`
  display: block;
  color: red;
  .input__name {
    margin-top: ${props => props.editingMarginTop};
    input {
      ${props => props.typographyCss};
      z-index: ${v.zIndex.aboveClickWrapper};
      position: relative;
      background-color: transparent;
      border-left: none;
      border-top: none;
      border-right: none;
      border-bottom: 1px solid
        ${props => props.theme.titleColor || v.colors.black};
      &:focus {
        outline: 0;
      }
    }
  }
`
StyledEditableName.displayName = 'StyledEditableName'

@inject('uiStore')
@observer
class EditableName extends React.Component {
  @observable
  name = ''

  constructor(props) {
    super(props)
    this.saveName = _.debounce(this._saveName, 1000)
  }

  componentDidMount() {
    const { name, editing } = this.props
    this.setName(name)
    if (editing) this.startEditingName()
  }

  // navigating between collections may trigger this instead of didMount
  componentDidUpdate(prevProps) {
    const { name, editing } = this.props
    if (name !== prevProps.name) {
      this.setName(name)
    }
    if (editing && !prevProps.editing) this.startEditingName()
  }

  @action
  componentWillUnmount() {
    const { uiStore, fieldName } = this.props
    uiStore.editingName.remove(fieldName)
  }

  onNameFieldKeypress = e => {
    if (e.key === 'Enter') {
      this.stopEditingName()
    }
  }

  @action
  setName(name) {
    this.name = name
  }

  onNameChange = e => {
    this.setName(e.target.value)
    this.saveName()
  }

  @action
  startEditingName = e => {
    e && e.stopPropagation()
    const { fieldName, uiStore } = this.props
    if (uiStore.editingName.includes(fieldName)) return
    uiStore.editingName.push(fieldName)
    setTimeout(() => {
      if (this.inputRef) {
        this.inputRef.focus()
      }
    }, 10)
  }

  @action
  stopEditingName = () => {
    // Ensure that save is called if user presses enter
    this.saveName.flush()
    const { fieldName, uiStore, onDoneEditing } = this.props
    uiStore.editingName.remove(fieldName)
    onDoneEditing && onDoneEditing()
  }

  _saveName = () => {
    this.props.updateNameHandler(this.name)
  }

  truncateName() {
    const { extraWidth, uiStore } = this.props
    if (!this.name) return ''
    // 64 == account for 32px padding x2
    const screenWidth = Math.min(uiStore.windowWidth - 64, v.maxWidth)
    // Estimation of width based on current font size
    const fontSizeMultiplier =
      screenWidth > v.responsive.smallBreakpoint ? 25 : 15
    const marginRightPadding = 30 + (extraWidth || 0)
    let width = this.name.length * fontSizeMultiplier
    // NOTE: this isn't really doing anything yet, but could be used to
    // calculate the "true width" of the H1
    if (this.textRef && this.name === this.truncatedName) {
      width = this.textRef.offsetWidth
    }
    const diff = width - (screenWidth - marginRightPadding)
    const truncateAmount = parseInt(diff / fontSizeMultiplier)
    // check if there is more than 1 letter to truncate
    if (truncateAmount > 1) {
      const mid = parseInt((this.name.length - truncateAmount) / 2)
      const firstPart = this.name.slice(0, mid)
      const secondPart = this.name.slice(mid + truncateAmount, this.name.length)
      this.truncatedName = `${firstPart}…${secondPart}`
      return this.truncatedName
    }
    return this.name
  }

  render() {
    const {
      canEdit,
      editFontSize,
      uiStore,
      TypographyComponent,
      typographyCss,
      fieldName,
      editingMarginTop,
      placeholder,
    } = this.props
    if (canEdit && uiStore.editingName.includes(fieldName)) {
      const clickHandlers = [() => this.stopEditingName()]
      return (
        <StyledEditableName
          typographyCss={typographyCss}
          className="styled-name"
          fontSize={editFontSize}
          editingMarginTop={editingMarginTop}
        >
          <AutosizeInput
            inputRef={ref => {
              this.inputRef = ref
            }}
            placeholder={placeholder}
            maxLength={v.maxTitleLength}
            className="input__name"
            style={{ fontSize: editFontSize }}
            value={this.name}
            onChange={this.onNameChange}
            onKeyPress={this.onNameFieldKeypress}
            data-cy={`EditableNameInput-${fieldName}`}
          />
          <ClickWrapper clickHandlers={clickHandlers} />
        </StyledEditableName>
      )
    }
    return (
      <StyledName className="styled-name" inline={this.props.inline}>
        <TypographyComponent
          className="editable-name-heading"
          data-cy={`EditableNameHeading-${fieldName}`}
          ref={ref => {
            this.textRef = ref
          }}
          onClick={canEdit ? this.startEditingName : null}
        >
          {this.truncateName()}
          {!this.name && placeholder && (
            <span style={{ color: v.colors.commonDark }}>{placeholder}</span>
          )}
        </TypographyComponent>
      </StyledName>
    )
  }
}

EditableName.propTypes = {
  /** The name string to be edited */
  name: PropTypes.string.isRequired,
  /** The function that will be called, that can handle persisting the name change */
  updateNameHandler: PropTypes.func.isRequired,
  /** If true, allows user to click to edit the name */
  canEdit: PropTypes.bool,
  /** Adds extra margin when calculating truncation of the name while displaying */
  extraWidth: PropTypes.number,
  /** Font size for the input that is shown when editing */
  editFontSize: PropTypes.number,
  /** The component that displays the name when uneditable */
  TypographyComponent: PropTypes.object,
  /** Custom css that is used for styling the input text */
  typographyCss: PropTypes.array,
  /** The key that is used in the uiStore.editingName array to mark this field as currently editing */
  fieldName: PropTypes.string,
  /** Margin added to the top of the input while editing */
  editingMarginTop: PropTypes.string,
  /** Placeholder text to show if user clears out input */
  placeholder: PropTypes.string,
  /** Whether to use display: inline for the uneditable name */
  inline: PropTypes.bool,
  /** Function called when editing has completed (user presses enter or blurs the input) */
  onDoneEditing: PropTypes.func,
  /** If true, starts in editing mode */
  editing: PropTypes.bool,
}

EditableName.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

EditableName.defaultProps = {
  canEdit: false,
  editFontSize: 2.25,
  extraWidth: 0,
  editingMarginTop: '0.5rem',
  TypographyComponent: Heading1,
  typographyCss: Heading1TypographyCss,
  fieldName: 'name',
  placeholder: '',
  inline: false,
  onDoneEditing: () => null,
  editing: false,
}

EditableName.displayName = 'EditableName'

export default EditableName
