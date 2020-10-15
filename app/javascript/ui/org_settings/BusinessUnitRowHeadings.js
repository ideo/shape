import PropTypes from 'prop-types'

import { Label } from '~/ui/global/styled/forms'
import { Row } from '~/ui/global/styled/layout'
import HoverableDescriptionIcon from '~/ui/global/HoverableDescriptionIcon'

import AddTeamButton from './AddTeamButton'

const BusinessUnitRowHeadings = ({ createBusinessUnit }) => {
  return (
    <Row>
      <Label
        style={{
          fontSize: '13px',
          marginBottom: '11px',
          marginRight: '20px',
          width: '170px',
        }}
        id={'name-label'}
      >
        Team <AddTeamButton handleClick={createBusinessUnit} />
      </Label>
      <Label
        style={{
          fontSize: '13px',
          marginBottom: '11px',
          marginRight: '20px',
          width: '244px',
          height: '32px',
          marginTop: 'auto',
        }}
        id={`industry-select-label`}
      >
        Industry
      </Label>
      <Label
        style={{
          fontSize: '13px',
          marginRight: '20px',
          marginBottom: '11px',
          width: '244px',
          height: '32px',
          marginTop: 'auto',
        }}
        id={`content-version-select-label`}
      >
        Content Version
        <HoverableDescriptionIcon
          description={
            'Content Versions provide alternative wording to content that are more suitable for certain kinds of teams or organizations. We suggest leaving the default if you are unsure.'
          }
          width={16}
        />
      </Label>
      <Label
        style={{
          fontSize: '13px',
          marginRight: '20px',
          marginBottom: '11px',
          width: '244px',
          height: '32px',
          marginTop: 'auto',
        }}
        id={`vertical-horizontal-select-label`}
      >
        Vertical or Horizontal
        <HoverableDescriptionIcon
          description={
            "Select 'Vertical' for any market-facing team or organizational unit. Select 'Horizontal' for any internally-facing teams, departments, or other organizational groups."
          }
          width={16}
        />
      </Label>
      {/* TODO: Update these so the headers are aligned properly */}
      <div
        style={{
          fontSize: '13px',
          width: '42px',
          marginRight: '20px',
          height: '32px',
          marginTop: 'auto',
        }}
      >
        {/* No header here */}
      </div>
      <Label
        style={{
          fontSize: '13px',
          width: '72px',
          marginRight: '20px',
          height: '32px',
          marginTop: 'auto',
          marginBottom: '11px',
        }}
      >
        Admins
      </Label>
      <Label
        style={{
          fontSize: '13px',
          width: '80px',
          height: '32px',
          marginTop: 'auto',
          marginBottom: '11px',
        }}
      >
        Members
      </Label>
    </Row>
  )
}

BusinessUnitRowHeadings.propTypes = {
  createBusinessUnit: PropTypes.func.isRequired,
}

export default BusinessUnitRowHeadings
