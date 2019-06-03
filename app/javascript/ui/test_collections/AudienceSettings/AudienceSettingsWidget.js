import PropTypes from 'prop-types'
import styled from 'styled-components'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'

import { DisplayTextCss } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import {
  StyledRowFlexItem,
  StyledRowFlexCell,
  StyledRowFlexParent,
  StyledColumnFlexParent,
} from './styled'
import TableHeader from './TableHeader'
import TableBody from './TableBody'
import AudienceCheckbox from './AudienceCheckbox'
import AddAudienceModal from './AddAudienceModal'
import Button from '~shared/components/atoms/Button'
import PlusIcon from '~shared/images/icon-plus.svg'

const AudienceSettingsWrapper = styled.div`
  width: 100%;
  max-width: 500px;
  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    max-width: 350px;
  }
  ${DisplayTextCss};
`

const DesktopWrapper = styled.div`
  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    display: none;
  }
`

const MobileWrapper = styled.div`
  @media only screen and (min-width: ${v.responsive.medBreakpoint}px) {
    display: none;
  }
`

@observer
class AudienceSettingsWidget extends React.Component {
  state = {
    addAudienceModalOpen: false,
  }

  openAddAudienceModal = () => {
    this.setState({ addAudienceModalOpen: true })
  }

  closeAddAudienceModal = () => {
    this.setState({ addAudienceModalOpen: false })
  }

  audienceSelected(audience) {
    const { audienceSettings } = this.props
    const option = audienceSettings[audience.id]
    return option ? option.selected : false
  }

  sampleSize(audience) {
    const { audienceSettings } = this.props
    const option = audienceSettings[audience.id]
    return option && option.sample_size ? option.sample_size.toString() : ''
  }

  isAudienceLocked(audience) {
    const { locked } = this.props
    return audience.price_per_response > 0 && locked
  }

  renderTableBody(audience) {
    const { onInputChange } = this.props
    return (
      <TableBody
        audience={audience}
        onInputChange={onInputChange}
        selected={this.audienceSelected(audience)}
        sampleSize={this.sampleSize(audience)}
        locked={this.isAudienceLocked(audience)}
      />
    )
  }

  renderCheckbox(audience) {
    const { onToggleCheckbox } = this.props
    return (
      <AudienceCheckbox
        audienceId={audience.id}
        audienceName={audience.name}
        selected={this.audienceSelected(audience)}
        onToggleCheckbox={onToggleCheckbox}
        disabled={this.isAudienceLocked(audience)}
      />
    )
  }

  render() {
    const { audiences, totalPrice, locked } = this.props

    let newAudienceButton = (
      <Flex align="center">
        <StyledRowFlexItem style={{ marginTop: '5px' }}>
          <Button href="#" onClick={this.openAddAudienceModal}>
            <PlusIcon width={15} style={{ fill: v.colors.black }} />
            New Audience
          </Button>
        </StyledRowFlexItem>
      </Flex>
    )
    if (locked) newAudienceButton = <div style={{ width: '250px' }} />

    const totalPriceDisplay = (
      <React.Fragment>
        <StyledRowFlexCell>Total</StyledRowFlexCell>
        <StyledRowFlexCell>
          <strong>{totalPrice}</strong>
        </StyledRowFlexCell>
      </React.Fragment>
    )
    return (
      <AudienceSettingsWrapper>
        <h3 style={{ marginBottom: '0px' }}>Audience</h3>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <MobileWrapper>
            <StyledColumnFlexParent>
              {audiences.map(audience => {
                return (
                  <StyledColumnFlexParent key={audience.id}>
                    {this.renderCheckbox(audience)}
                    <TableHeader />
                    {this.renderTableBody(audience)}
                  </StyledColumnFlexParent>
                )
              })}
              <StyledRowFlexParent style={{ marginTop: '15px' }}>
                {newAudienceButton}
                <StyledRowFlexCell />
                {totalPriceDisplay}
              </StyledRowFlexParent>
            </StyledColumnFlexParent>
          </MobileWrapper>

          <DesktopWrapper>
            <StyledRowFlexParent column>
              <StyledRowFlexParent>
                <StyledRowFlexItem />
                <TableHeader />
              </StyledRowFlexParent>
              {audiences.map(audience => {
                return (
                  <StyledRowFlexParent key={audience.id}>
                    {this.renderCheckbox(audience)}
                    {this.renderTableBody(audience)}
                  </StyledRowFlexParent>
                )
              })}
              <StyledRowFlexParent>
                {newAudienceButton}
                <StyledRowFlexCell />
                {totalPriceDisplay}
              </StyledRowFlexParent>
            </StyledRowFlexParent>
          </DesktopWrapper>

          <StyledColumnFlexParent />
        </div>
        <AddAudienceModal
          open={this.state.addAudienceModalOpen}
          close={this.closeAddAudienceModal}
        />
      </AudienceSettingsWrapper>
    )
  }
}

AudienceSettingsWidget.propTypes = {
  audiences: MobxPropTypes.arrayOrObservableArray.isRequired,
  audienceSettings: MobxPropTypes.objectOrObservableObject.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onToggleCheckbox: PropTypes.func.isRequired,
  totalPrice: PropTypes.string.isRequired,
  locked: PropTypes.bool,
}

AudienceSettingsWidget.defaultProps = {
  locked: false,
}

export default AudienceSettingsWidget
