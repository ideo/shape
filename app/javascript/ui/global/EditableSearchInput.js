import PropTypes from 'prop-types'
import styled from 'styled-components'

import CloseIcon from '~/ui/icons/CloseIcon'
import EditPencilIcon from '~/ui/icons/EditPencilIcon'
import ExpandableSearchInput from '~/ui/global/ExpandableSearchInput'
import { NamedActionButton } from '~/ui/global/styled/buttons'
import v from '~/utils/variables'

const Holder = styled.div``

const EditButton = styled(NamedActionButton)`
  color: ${v.colors.commonDark};
  padding: 0;
  right: 5px;
  position: absolute;
  text-transform: none;
  top: 10px;
  z-index: 360;

  &:hover {
    color: black;
  }

  svg,
  .icon {
    height: 13px;
    width: 13px;
  }
`

class EditableSearchInput extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      editing: false,
    }
  }

  onEdit = ev => {
    this.setState({ editing: !this.state.editing })
  }

  render() {
    const { value, onChange, canEdit, dataCy } = this.props
    const { editing } = this.state
    return (
      <Holder>
        <ExpandableSearchInput
          background={v.colors.commonLight}
          defaultOpen={true}
          value={value}
          onChange={onChange}
          disabled={!editing}
          dataCy={dataCy}
        />
        {canEdit && (
          <EditButton onClick={this.onEdit} data-cy="SearchCollectionEditTerm">
            {editing ? <CloseIcon /> : <EditPencilIcon />}
            {editing ? 'close' : 'edit'}
          </EditButton>
        )}
      </Holder>
    )
  }
}

EditableSearchInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  canEdit: PropTypes.bool,
  dataCy: PropTypes.string,
}

EditableSearchInput.defaultProps = {
  canEdit: false,
  dataCy: '',
}

export default EditableSearchInput
