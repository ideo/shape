import Icon from './Icon'

const CommentIconFilled = ({ text, textColor } = {}) => (
  <Icon fill>
    <svg
      width="13"
      height="10"
      viewBox="0 0 13 10"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.00806 0H11.3686C11.9244 0 12.3766 0.396333 12.3766 0.884335V6.65678C12.3766 7.14478 11.9244 7.54112 11.3686 7.54112H6.4121L3.36375 9.90833C3.28483 9.97034 3.1869 10 3.08783 10C3.02561 10 2.96312 9.98921 2.90436 9.96225C2.75286 9.89485 2.65609 9.75196 2.65609 9.59558V7.54112H2.00806C1.45218 7.54112 1 7.14478 1 6.65678V0.884335C1 0.396333 1.45218 0 2.00806 0Z"
      />
      <mask
        id="mask0"
        mask-type="alpha"
        maskUnits="userSpaceOnUse"
        x="1"
        y="0"
        width="12"
        height="10"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M2.00806 0H11.3686C11.9244 0 12.3766 0.396333 12.3766 0.884335V6.65678C12.3766 7.14478 11.9244 7.54112 11.3686 7.54112H6.4121L3.36375 9.90833C3.28483 9.97034 3.1869 10 3.08783 10C3.02561 10 2.96312 9.98921 2.90436 9.96225C2.75286 9.89485 2.65609 9.75196 2.65609 9.59558V7.54112H2.00806C1.45218 7.54112 1 7.14478 1 6.65678V0.884335C1 0.396333 1.45218 0 2.00806 0Z"
          fill="white"
        />
      </mask>
      <g mask="url(#mask0)">
        <rect x="-8" y="-7" width="30" height="30" />
      </g>
      <text
        textAnchor="middle"
        x="50%"
        y="50%"
        dy="0.17em"
        fontSize=".45em"
        fill="#f2f1ee" // IE11 wants this to be specified
        fontFamily="Gotham"
        fontWeight="500"
      >
        {text}
      </text>
    </svg>{' '}
  </Icon>
)

export default CommentIconFilled
