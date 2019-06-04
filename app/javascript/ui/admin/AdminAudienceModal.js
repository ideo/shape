import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Flex } from 'reflexbox'

import Modal from '~/ui/global/modals/Modal'
import { FieldContainer, Label, TextField } from '~/ui/global/styled/forms'
import HorizontalDivider from '~shared/components/atoms/HorizontalDivider'
import v from '~/utils/variables'

const SelectedOptionsWrapper = styled(Flex)`
  min-height: 40px;
`

const SelectedOption = styled.span`
  background: ${v.colors.commonLightest};
  font-family: ${v.fonts.sans};
  margin-bottom: 8px;
  margin-right: 8px;
  padding: 8px 12px;
`
SelectedOption.displayName = 'SelectedOption'

@inject('apiStore', 'uiStore')
@observer
class AdminAudienceModal extends React.Component {
  componentDidMount() {
    // Fetch a single audience?
    // Or is that already available from initial page load / props
  }

  handleClose = async ev => {
    const { uiStore, open } = this.props
    if (open) {
      uiStore.closeAdminUsersMenu()
    }
  }

  render() {
    const { audience, open } = this.props
    const title = `${audience.name} Definition`
    // const { criteria } = audience
    const criteria = ['vegans', 'chocolate lovers']

    return (
      <Modal title={title} onClose={this.handleClose} open={open} noScroll>
        <React.Fragment>
          <FieldContainer>
            <Label htmlFor="audienceName">Audience Name</Label>
            <TextField
              id="audienceName"
              type="text"
              data-cy="TextField_audienceName"
              value={audience.name}
              onChange={this.handleNameChange}
              disabled
            />
          </FieldContainer>
          <FieldContainer>
            <Label htmlFor="audienceCriteria">Targeting Criteria</Label>
            <SelectedOptionsWrapper wrap>
              {criteria.map((option, index) => (
                // Need to split out the criteria by category, e.g., country, age, etc.
                <SelectedOption key={`selected_${option}`}>
                  Option {index}
                </SelectedOption>
              ))}
            </SelectedOptionsWrapper>
            <HorizontalDivider
              color={v.colors.commonMedium}
              style={{ borderWidth: '0 0 1px 0', marginBlockStart: 0 }}
            />
          </FieldContainer>
        </React.Fragment>
      </Modal>
    )
  }
}

AdminAudienceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  audience: PropTypes.shape({
    name: PropTypes.string.isRequired,
    // TODO:  need anything else here?
  }).isRequired,
}
AdminAudienceModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AdminAudienceModal
