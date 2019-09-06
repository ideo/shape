import PropTypes from 'prop-types'
import Grid from '@material-ui/core/Grid'
import styled from 'styled-components'
import { Flex } from 'reflexbox'
import v from '~/utils/variables'
import { TextField } from '~/ui/global/styled/forms'

class AdminNewQueryRow extends React.Component {
  constructor(props) {
    super(props)
    this.textFieldRef = React.createRef()
  }

  componentDidMount() {
    this.textFieldRef.current.focus()
  }

  handleKeyDown(ev) {
    const enter = 13
    const escape = 27

    if (ev.keyCode === enter) {
      // triggers handleBlur() to open modal
      ev.target.blur()
    } else if (ev.keyCode === escape) {
      this.props.hideNewQueryRow()
    }
  }

  handleBlur(ev) {
    const responsesRequested = parseInt(ev.target.value)

    if (responsesRequested) {
      this.props.openNewQueryModal(responsesRequested)
    } else {
      this.props.hideNewQueryRow()
    }
  }

  render() {
    return (
      <Grid container item xs={12} style={{ marginBottom: '1rem' }}>
        <NewQueryRowItem item xs={5} />
        <NewQueryRowItem item xs={2}>
          <Flex justify="flex-end">
            <TextField
              data-cy="NewQueryCountTextField"
              type="text"
              onKeyDown={ev => this.handleKeyDown(ev)}
              onBlur={ev => this.handleBlur(ev)}
              style={{
                textAlign: 'right',
                width: '35px',
                backgroundColor: v.colors.commonLight,
              }}
              ref={this.textFieldRef}
            />
          </Flex>
        </NewQueryRowItem>
        <NewQueryRowItem item xs={3}>
          <Flex justify="flex-end">-</Flex>
        </NewQueryRowItem>
        <NewQueryRowItem item xs={2}>
          <Flex justify="flex-end">-</Flex>
        </NewQueryRowItem>
      </Grid>
    )
  }
}

AdminNewQueryRow.propTypes = {
  hideNewQueryRow: PropTypes.func.isRequired,
  openNewQueryModal: PropTypes.func.isRequired,
}

const NewQueryRowItem = styled(Grid)`
  background-color: ${v.colors.commonLight};
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
`

NewQueryRowItem.displayName = 'NewQueryRowItem'

export default AdminNewQueryRow
