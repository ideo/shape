import styled from 'styled-components'

import v from '~/utils/variables'

// adapted from https://raw.githubusercontent.com/i-like-robots/react-tags/master/example/styles.css
export default styled.div`
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};

  .react-tags {
    position: relative;
    padding: 6px 0 1px 6px;
    border-bottom: 1px solid ${v.colors.commonDark};
    /* shared font styles */
    font-size: 1em;
    line-height: 1.2;
    /* clicking anywhere will focus the input */
    cursor: text;
    &.is-focused {
      border-width: 2px;
      padding-bottom: 0;
      border-color: ${v.colors.black};
    }
  }

  .react-tags__selected {
    display: block;
  }

  .react-tags__selected-tag {
    display: inline-block;
    box-sizing: border-box;
    margin: 0 6px 6px 0;
    padding: 10px 12px;
    background: ${props =>
      props.tagColor === 'white' ? 'white' : v.colors.commonLight};
    /* match the font styles */
    font-size: inherit;
    line-height: inherit;
    &:after {
      content: '×';
      color: ${v.colors.commonDark};
      margin-left: 8px;
    }
    &.read-only:after {
      content: '';
    }
    &:hover,
    &:focus {
      &:after {
        color: red;
      }
    }
  }

  .react-tags__search {
    display: inline-block;
    /* match tag layout */
    padding: 7px 2px;
    margin-top: 10px;
    margin-bottom: 6px;
    /* prevent autoresize overflowing the container */
    max-width: 100%;
    input {
      background: transparent;
      font-family: ${v.fonts.sans};
      font-weight: ${v.weights.book};
      /* prevent autoresize overflowing the container */
      max-width: 100%;
      /* remove styles and layout from this element */
      margin: 0;
      padding: 0;
      border: 0;
      outline: none;
      /* match the font styles */
      font-size: inherit;
      line-height: inherit;
      &::-ms-clear {
        display: none;
      }
    }
  }

  @media screen and (min-width: 30em) {
    .react-tags__search {
      /* this will become the offsetParent for suggestions */
      position: relative;
    }
  }

  .react-tags__suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    ul {
      margin: 4px -1px;
      padding: 0;
      list-style: none;
      background: white;
      border: 1px solid #d1d1d1;
      border-radius: 2px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    li {
      border-bottom: 1px solid #ddd;
      padding: 6px 8px;
      mark {
        text-decoration: underline;
        background: none;
        font-weight: 600;
      }
      &:hover {
        cursor: pointer;
        background: #eee;
      }
      &.is-active {
        background: #b7cfe0;
      }
      &.is-disabled {
        opacity: 0.5;
        cursor: auto;
      }
    }
  }

  .error {
    margin-top: 0.5rem;
    margin-left: 0.5rem;
    font-size: 0.9rem;
    color: ${v.colors.alert};
  }

  @media screen and (min-width: 30em) {
    .react-tags__suggestions {
      width: 240px;
    }
  }
`
