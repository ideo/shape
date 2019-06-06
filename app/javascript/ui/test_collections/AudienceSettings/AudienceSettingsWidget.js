import PropTypes from 'prop-types'
import styled from 'styled-components'
import { concat, filter, reject, sortBy } from 'lodash'
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
import PlusIcon from '~/ui/icons/PlusIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'
import ClickWrapper from '~/ui/layout/ClickWrapper'

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

const AddAudienceButton = styled(Button)`
  z-index: ${v.zIndex.aboveClickWrapper};
`

const AddAudienceMenu = styled.span`
  .menu-wrapper {
    left: 0;
    top: -35px;
  }

  .icon {
    left: 0;
    line-height: 2.4rem !important;
    margin-right: 8px;
    position: relative !important;
    vertical-align: middle;
  }
`

const StyledPlusIcon = styled.span`
  height: 15px;
  margin-right: 8px;
  width: 15px;
`

@observer
class AudienceSettingsWidget extends React.Component {
  state = {
    addAudienceMenuOpen: false,
    addAudienceModalOpen: false,
    selectedOrgAudiences: [],
  }

  toggleAddAudienceMenu = () => {
    this.setState({ addAudienceMenuOpen: !this.state.addAudienceMenuOpen })
  }

  closeAddAudienceMenu = () => {
    this.setState({ addAudienceMenuOpen: false })
  }

  openAddAudienceModal = () => {
    this.closeAddAudienceMenu()
    this.setState({ addAudienceModalOpen: true })
  }

  closeAddAudienceModal = () => {
    this.setState({ addAudienceModalOpen: false })
  }

  defaultAudiences() {
    const { audiences } = this.props
    const defaultAudiences = filter(audiences, a => a.global)
    console.log({ defaultAudiences })
    return sortBy(defaultAudiences, a => a.price_per_response)
  }

  organizationAudiences() {
    const { audiences } = this.props
    const orgAudiences = reject(audiences, a => a.global)
    // need to limit this to 6 audiences AT FIRST
    // What does "at first" mean?
    console.log(orgAudiences.map(audience => `${audience.name}`))
    console.log(
      orgAudiences.map(audience => `${audience.currentTestAudience.createdAt}`)
    )
    return sortBy(orgAudiences, a => a.name)
  }

  addAudienceMenuItems() {
    const orgAudiences = this.organizationAudiences()
    const audienceItems = orgAudiences.map(audience => ({
      name: audience.name,
      onClick: () => {
        this.closeAddAudienceMenu()
        this.addAudience(audience)
      },
    }))

    audienceItems.push({
      name: 'New Audience',
      iconLeft: <PlusIcon />,
      onClick: this.openAddAudienceModal,
    })

    return audienceItems
  }

  addAudience(audience) {
    const { afterAddAudience } = this.props
    const { selectedOrgAudiences } = this.state
    if (selectedOrgAudiences.indexOf(audience) === -1) {
      selectedOrgAudiences.push(audience)
      this.setState({ selectedOrgAudiences })
    }
    if (afterAddAudience) {
      afterAddAudience(audience)
    }
  }

  audienceSelected(audience) {
    const { audienceSettings } = this.props
    const option = audienceSettings.get(audience.id)
    return option ? option.selected : false
  }

  sampleSize(audience) {
    const { audienceSettings } = this.props
    const option = audienceSettings.get(audience.id)
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
    const { totalPrice, locked } = this.props
    const { addAudienceMenuOpen, selectedOrgAudiences } = this.state
    const audiences = concat(this.defaultAudiences(), selectedOrgAudiences)

    let newAudienceButton = (
      <Flex align="center">
        <StyledRowFlexItem style={{ marginTop: '5px' }}>
          <AddAudienceButton onClick={this.toggleAddAudienceMenu}>
            <StyledPlusIcon>
              <PlusIcon />
            </StyledPlusIcon>
            Audience
          </AddAudienceButton>
          <AddAudienceMenu>
            <PopoutMenu
              wrapperClassName="add-audience-menu"
              menuOpen={addAudienceMenuOpen}
              menuItems={this.addAudienceMenuItems()}
              hideDotMenu
            />
          </AddAudienceMenu>
        </StyledRowFlexItem>
        {addAudienceMenuOpen && (
          <ClickWrapper clickHandlers={[this.closeAddAudienceMenu]} />
        )}
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
          afterSave={audience => this.addAudience(audience)}
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
  afterAddAudience: PropTypes.func.isRequired,
  totalPrice: PropTypes.string.isRequired,
  locked: PropTypes.bool,
}

AudienceSettingsWidget.defaultProps = {
  locked: false,
}

export default AudienceSettingsWidget
