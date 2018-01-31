import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

const Hello = props => (
  <div>Hola {props.name}!</div>
)

Hello.defaultProps = {
  name: 'Person'
}

Hello.propTypes = {
  name: PropTypes.string
}

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    <Hello name="World" />,
    document.body.appendChild(document.createElement('div')),
  )
})
