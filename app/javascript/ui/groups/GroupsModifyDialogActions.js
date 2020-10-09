import PropTypes from 'prop-types'
import { Fragment } from 'react'
import Button from '~/ui/global/Button'
import TextButton from '~/ui/global/TextButton'
import { SubduedText } from '~/ui/global/styled/typography'
import { FormActionsContainer } from '~/ui/global/styled/forms'

class GroupsModifyDialogActions extends React.Component {
  render() {
    const {
      groupType,
      isLoading,
      creatingOrg,
      onCancel,
      formDisabled,
    } = this.props

    return (
      <Fragment>
        <FormActionsContainer>
          <Button
            data-cy="FormButton_submitGroup"
            disabled={formDisabled || isLoading}
            onClick={this.handleSave}
            minWidth={190}
            type="submit"
          >
            {groupType === 'Group' ? 'Add Members' : 'Save'}
          </Button>
        </FormActionsContainer>
        {creatingOrg && (
          <div style={{ textAlign: 'center' }}>
            <SubduedText fontSize="12px">
              Are you looking for your team? You may need to ask for an
              invitation.
            </SubduedText>
            <br />
            <br />
            <TextButton onClick={onCancel}>Come back later</TextButton>
          </div>
        )}
      </Fragment>
    )
  }
}

GroupsModifyDialogActions.propTypes = {
  onCancel: PropTypes.func,
  groupType: PropTypes.oneOf(['Group', 'Organization']),
  creatingOrg: PropTypes.bool,
  isLoading: PropTypes.bool,
  formDisabled: PropTypes.bool,
}

GroupsModifyDialogActions.defaultProps = {
  onCancel: () => {},
  groupType: 'Group',
  creatingOrg: false,
  isLoading: false,
  formDisabled: false,
}

export default GroupsModifyDialogActions
