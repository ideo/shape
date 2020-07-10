import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Grid } from '@material-ui/core'
import { MaxWidthContainer } from '~/ui/global/styled/layout'
import v from '~/utils/variables'

const StyledBanner = styled.div`
  position: relative; /* necessary to get above the FixedBoundary */
  background-color: ${({ color }) => color};
  color: white;
  font-family: ${v.fonts.sans};
  font-size: 1.33rem;
  padding: 20px;
  margin: 10px 0;

  a {
    color: white;
  }
`
StyledBanner.displayName = 'StyledBanner'

const StyledAction = styled.div`
  font-size: 1rem;
  text-align: right;

  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    margin-top: 1rem;
  }
`

class Banner extends React.Component {
  render() {
    return (
      <StyledBanner color={this.props.color}>
        <MaxWidthContainer>
          <Grid container justify="space-between" alignItems="center">
            <Grid
              item
              xs={12}
              md={8}
              container
              spacing={2}
              alignItems="flex-end"
            >
              {this.props.leftComponent}
            </Grid>
            <Grid item xs={12} md={4}>
              <StyledAction>{this.props.rightComponent}</StyledAction>
            </Grid>
          </Grid>
        </MaxWidthContainer>
      </StyledBanner>
    )
  }
}

Banner.propTypes = {
  color: PropTypes.oneOf(Object.values(v.colors)),
  leftComponent: PropTypes.object.isRequired,
  rightComponent: PropTypes.object.isRequired,
}

Banner.defaultProps = {
  color: v.colors.alert,
  leftComponent: () => null,
  rightComponent: () => null,
}

export default Banner
