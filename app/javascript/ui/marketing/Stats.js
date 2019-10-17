import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Box } from 'reflexbox'
import v from '~/utils/variables'

import { DisplayText } from '~/ui/global/styled/typography'
import { MarketingH1Bold, MarketingFlex } from '~/ui/global/styled/marketing.js'

const StatsContainer = styled.section`
  background-color: ${v.colors.commonLigh};
  padding: 88px 0;
  text-transform: none;
  width: 100%;

  .small-stat {
    background: ${v.colors.commonLight};
    display: none;
  }

  @media (max-width: 831px) {
    padding: 24px 0;

    .stat {
      display: none;
    }

    .small-stat {
      display: block;
    }
  }
`

const StatsIntro = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;

  h2 {
    font-size: 32px;
    font-weight: bold;
    line-height: 1.25;
    text-align: center;
    color: ${v.colors.black};
    margin: 0 0 40px 0;
  }
`

const StatsBannerImages = styled.div`
  background: ${v.colors.commonLight};
  height: 305px;

  @media (max-width: 768px) {
    height: auto;
  }

  img {
    max-width: 100%;
    width: 100%;
    height: auto;
    position: relative;
    bottom: -45px;
  }
`

const StatHeading = styled.h3`
  font-size: 36px;
  font-weight: normal;
  font-style: normal;
  font-stretch: normal;
  letter-spacing: -0.1px;
  color: black;
  margin: 0;
  text-transform: none;
`

const StatBody = styled(DisplayText)`
  text-transform: none;
  font-size: 18px;
  font-weight: normal;
  font-style: normal;
  font-stretch: normal;
  line-height: 1.39;
  letter-spacing: normal;
  color: black;
  margin: 0;
`
const Stat = props => (
  <Box
    flex
    w={[1, 1, 414]}
    justify="center"
    column
    pt={[40, 40, 0]}
    pb={[82, 82, 0]}
    px={[24, 24, 16]}
    className={props.small ? 'small-stat' : 'stat'}
  >
    <StatHeading>{props.title}</StatHeading>
    <StatBody>{props.subtext}</StatBody>
  </Box>
)
Stat.propTypes = {
  title: PropTypes.string.isRequired,
  subtext: PropTypes.string.isRequired,
  small: PropTypes.bool,
}
Stat.defaultProps = {
  small: false,
}

const Stats = props => (
  <StatsContainer>
    <StatsIntro>
      <Box px={[24, 24, 0]} style={{ maxWidth: '792px' }} mb={[30, 30, 30]}>
        <MarketingH1Bold>{props.title}</MarketingH1Bold>
        <DisplayText>{props.subtext}</DisplayText>
      </Box>
    </StatsIntro>
    <StatsBannerImages className="banner-images">
      <Box
        flex
        justify={'center'}
        align={'center'}
        column={[true, true, false]}
        mb={[0, 0, 65]}
        w={1}
      >
        {props.banner_image && (
          <Box
            w={[1, 1, 1200]}
            align="center"
            flex
            column={[true, true, false]}
          >
            <img src={props.banner_image} />
          </Box>
        )}
        {props.banner_images &&
          props.banner_images.map((image, index) => (
            <Box
              key={index.toString()}
              w={[1, 1, 400]}
              align="baseline"
              flex
              column={[true, true, false]}
            >
              <img src={image} />
              <Stat
                title={props.stats[index].title}
                subtext={props.stats[index].subtext}
                small
              />
            </Box>
          ))}
      </Box>
    </StatsBannerImages>
    <MarketingFlex justify="center" mt={25}>
      <Box style={{ maxWidth: 1200 }} flex w={1} justify="space-between">
        {props.stats.map((stat, index) => (
          <Stat
            key={index.toString()}
            title={stat.title}
            subtext={stat.subtext}
          />
        ))}
      </Box>
    </MarketingFlex>
  </StatsContainer>
)
Stats.propTypes = {
  title: PropTypes.string.isRequired,
  subtext: PropTypes.string.isRequired,
  banner_image: PropTypes.string.isRequired,
  stats: PropTypes.array.isRequired,
  banner_images: PropTypes.array,
}
Stats.defaultProps = {
  banner_images: [],
}

export default Stats
