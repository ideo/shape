import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Box } from 'reflexbox'
import {
  MarketingContent,
  MarketingH1Bold,
  MarketingFlex,
} from '~/ui/global/styled/marketing.js'
import v from '~/utils/variables'

const StyledHtmlImage = styled(MarketingContent)`
  margin-left: 24px;
  margin-right: 24px;
  padding-top: 0px;
  padding-bottom: 0px;

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    margin-left: 0px;
    margin-right: 0px;
    padding-top: 36px;
    padding-bottom: 24px;
  }
`

const Title = styled(MarketingH1Bold)`
  text-transform: none;
  text-align: left;
  word-wrap: break-word;
  line-height: 30px;
  margin-bottom: 16px;

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    line-height: 40px;
  }
`

const StyledInnerHTML = styled.div`
  text-align: left;
  word-wrap: break-word;
  line-height: 25px;
  font-size: 18px;
  h3 {
    text-transform: uppercase;
    margin-top: 17px;
    margin-bottom: 13px;
    font-size: 0.9375rem;
    font-weight: ${v.weights.medium};
    letter-spacing: 0.0625rem;
    color: ${v.colors.black};
  }
  ul {
    list-style-type: disc;
    margin-left: 20px;
    padding: 10px 0;
    li {
      margin-bottom: 5px;
    }
  }
  a {
    margin: 10px 0;
    display: block;
    background-color: ${v.colors.caution};
    border-radius: 4px;
    border: 2px solid ${v.colors.caution};
    padding: 12px 16px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    font-size: 14px;
    font-weight: ${v.weights.medium};
    width: 180px;
    text-decoration: none;
    text-align: center;
    color: ${v.colors.black};
  }
`
StyledInnerHTML.displayName = 'StyledInnerHTML'

const ImageDisplay = styled.img`
  object-fit: scale-down;
  max-width: 100%;
  max-height: 100%;
  height: auto;
  ${props =>
    props.shadow &&
    `
    box-shadow: 0px 2px 16px ${v.colors.commonMedium};
  `}
`

class ContentBlock extends React.PureComponent {
  render() {
    const { order, title, content, imageUrl, imageShadow } = this.props
    const html = `${content}` // needed due to https://reactjs.org/docs/jsx-in-depth.html#string-literals
    return (
      <StyledHtmlImage key={title.toString()} order={order}>
        <MarketingFlex
          w={1}
          mt={[4, 1, 1]}
          mb={[4, 1, 1]}
          align={[
            'flex-start',
            this.props.order % 2 === 1 ? 'flex-start' : 'flex-end',
          ]}
          justify="space-evenly"
          wrap
        >
          <Box
            w={[1, 1, 0.21]}
            pl={[50, 50, 0]}
            pr={[50, 50, 0]}
            mb={[0, 20, 20]}
            mt={[0, 0, 50]}
            mb={[40, 0, 20]}
            order={[0, 0, 1]}
          >
            <Title>{title}</Title>
            {<StyledInnerHTML dangerouslySetInnerHTML={{ __html: html }} />}
          </Box>
          <Box
            w={[1, 1, 0.54]}
            pl={[10, 10, 0]}
            pr={[10, 10, 0]}
            mt={[0, 40, 40]}
            order={[1, 1, order % 2 === 0 ? 0 : 3]}
          >
            <ImageDisplay src={imageUrl} alt={title} shadow={imageShadow} />
          </Box>
        </MarketingFlex>
      </StyledHtmlImage>
    )
  }
}

ContentBlock.propTypes = {
  order: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  imageUrl: PropTypes.string.isRequired,
  imageShadow: PropTypes.bool,
}
ContentBlock.defaultProps = {
  imageShadow: true,
}

export default ContentBlock
