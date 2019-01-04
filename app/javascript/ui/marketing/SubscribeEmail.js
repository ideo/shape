import styled from 'styled-components'
import v from '~/utils/variables'

const SubscribeInput = styled.input`
  width: 180px;
  font-weight: ${v.weights.book};
  font-family: ${v.fonts.sans};
  font-size: 16px;
  padding: 12px 12px;
  cursor: pointer;
  letter-spacing: 1.5px;
  box-sizing: border-box;
  border-radius: 2px;
  border: 2px solid white;
  margin: 4px;
  margin-right: 0;

  ::placeholder {
    color: ${v.colors.placeholderGray};
    opacity: 1;
  }

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    width: 320.3px;
    margin: 16px;
    margin-right: -4px;
  }
`

const SubscribeButton = styled.button`
  font-weight: ${v.weights.medium};
  font-family: ${v.fonts.sans};
  font-size: 14px;
  color: white;
  margin: 4px;
  padding: 14px 14px;
  cursor: pointer;
  letter-spacing: 0.5px;
  border-radius: 4px;
  border: 2px solid white;
  text-transform: uppercase;

  &:hover {
    background-color: black;
    border-color: black;
  }

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    padding: 14px 20px;
    margin: 14px;
  }
`

class SubscribeEmail extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      emailText: '',
    }
  }

  render() {
    return (
      <div id="mc_embed_signup">
        <form
          action="https://ideocreativedifference.us11.list-manage.com/subscribe/post"
          method="POST"
          id="mc-embedded-subscribe-form"
          name="mc-embedded-subscribe-form"
          target="_blank"
          noValidate
        >
          <input type="hidden" name="u" value="2f039cb306f0565682c88c494" />
          <input type="hidden" name="id" value="b141f584d3" />
          {/* Add to Mailchimp Group IDEOProduct: Shape */}
          <input type="hidden" name="group[1][2]" id="group_2" value="1" />

          <SubscribeInput
            id="mce-EMAIL"
            name="EMAIL"
            type="email"
            placeholder="Email"
            value={this.state.emailText}
            onChange={e => {
              this.setState({ emailText: e.target.value })
            }}
            autoCapitalize="off"
            autoCorrect="off"
          />
          <SubscribeButton id="mc-embedded-subscribe" type="submit">
            Subscribe
          </SubscribeButton>
          <div
            style={{ position: 'absolute', left: '-5000px' }}
            aria-hidden="true"
            aria-label="Please leave the following three fields empty"
          >
            <label htmlFor="b_name">
              Name:
              <input
                type="text"
                name="b_name"
                tabIndex="-1"
                value=""
                placeholder="Freddie"
                id="b_name"
              />
            </label>

            <label htmlFor="b_email">
              Email:
              <input
                type="email"
                name="b_email"
                tabIndex="-1"
                value=""
                placeholder="youremail@gmail.com"
                id="b_email"
              />
            </label>

            <label htmlFor="b_comment">
              Comment:
              <textarea
                name="b_comment"
                tabIndex="-1"
                placeholder="Please comment"
                id="b_comment"
              />
            </label>
          </div>
        </form>
      </div>
    )
  }
}

export default SubscribeEmail
