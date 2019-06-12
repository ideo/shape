import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Grid } from '@material-ui/core'
import { MaxWidthContainer } from '~/ui/global/styled/layout'
import v from '~/utils/variables'

const StyledBanner = styled.div`
  background-color: ${props => (props.color ? props.color : v.colors.alert)};
  color: white;
  font-family: ${v.fonts.sans};
  font-size: 1.33rem;
  padding: 20px;

  a {
    color: white;
  }
`
StyledBanner.displayName = 'StyledBanner'

const StyledAction = styled.div`
  font-size: 1rem;
  text-align: right;
`

class Banner extends React.Component {
  render() {
    const { leftComponent, rightComponent, color } = this.props
    return (
      <StyledBanner color={color}>
        <MaxWidthContainer>
          <Grid container justify="space-between" alignItems="center">
            <Grid
              item
              xs={12}
              md={8}
              container
              spacing={16}
              alignItems="flex-end"
            >
              {leftComponent}
            </Grid>
            <Grid item xs={12} md={4}>
              <StyledAction>{rightComponent}</StyledAction>
            </Grid>
          </Grid>
        </MaxWidthContainer>
      </StyledBanner>
    )
  }
}

Banner.propTypes = {
  leftComponent: PropTypes.object.isRequired,
  rightComponent: PropTypes.object.isRequired,
  color: PropTypes.string, // should this be required or just leave the default?
}

Banner.defaultProps = {
  leftComponent: () => null,
  rightComponent: () => null,
  color: v.colors.alert,
}

export default Banner
