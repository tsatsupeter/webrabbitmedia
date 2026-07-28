// Inline stroke icons. size prop = px.
const paths = {
  rocket: <path d="M5 15c-1 2-1 5-1 5s3 0 5-1m1-4a4 4 0 105.657-5.657L14 5l-1 1m-2 8l-3-3m3 3l3 2 5-5c3-3 3-8 3-8s-5 0-8 3l-5 5 2 3z" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />,
  home: <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9z" />,
  chart: <path d="M4 20V10m6 10V4m6 16v-8m6 8V8" />,
  sparkles: <path d="M12 3l1.5 4L18 8.5 13.5 10 12 14l-1.5-4L6 8.5 10.5 7 12 3zM19 14l.75 2 2 .75-2 .75L19 19.5l-.75-2-2-.75 2-.75L19 14zM5 15l.6 1.6L7 17l-1.4.4L5 19l-.6-1.6L3 17l1.4-.4L5 15z" />,
  box: <path d="M3 7l9-4 9 4v10l-9 4-9-4V7zm0 0l9 4m0 0l9-4m-9 4v10" />,
  key: <path d="M15 9a4 4 0 11-4 4l-6 6v2h2v-2h2v-2h2v-2l2-2a4 4 0 014-4z" />,
  cash: <path d="M3 6h18v12H3V6zm9 3a3 3 0 100 6 3 3 0 000-6z" />,
  swap: <path d="M4 8h13l-3-3m6 11H7l3 3" />,
  wallet: <path d="M3 7a2 2 0 012-2h13v4h2v6h-2v4H5a2 2 0 01-2-2V7zm14 6h2v-2h-2a1 1 0 100 2z" />,
  store: <path d="M4 9l1-5h14l1 5M4 9v11h16V9M4 9h16M9 20v-5h6v5" />,
  code: <path d="M8 6l-5 6 5 6m8-12l5 6-5 6m-2-14l-4 16" />,
  life: <path d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 5a4 4 0 100 8 4 4 0 000-8zm-6.4-.6l3.2 3.2m6.4 6.4l3.2 3.2m0-12.8l-3.2 3.2m-6.4 6.4l-3.2 3.2" />,
  gear: <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm8 4a8 8 0 00-.2-1.8l2-1.6-2-3.4-2.3.8a8 8 0 00-3-1.8L14 2h-4l-.5 2.2a8 8 0 00-3 1.8L4.2 5.2l-2 3.4 2 1.6A8 8 0 004 12c0 .6.1 1.2.2 1.8l-2 1.6 2 3.4 2.3-.8a8 8 0 003 1.8L10 22h4l.5-2.2a8 8 0 003-1.8l2.3.8 2-3.4-2-1.6c.1-.6.2-1.2.2-1.8z" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  search: <path d="M11 4a7 7 0 105 12l4 4-1.5-5A7 7 0 0011 4z" />,
  bell: <path d="M6 8a6 6 0 1112 0c0 6 3 7 3 7H3s3-1 3-7zm3 10a3 3 0 006 0" />,
  sun: <path d="M12 4v2m0 12v2M4 12H2m20 0h-2M6 6L4.5 4.5M19.5 19.5L18 18M6 18l-1.5 1.5M19.5 4.5L18 6M12 8a4 4 0 100 8 4 4 0 000-8z" />,
  menu: <path d="M4 7h16M4 12h12M4 17h16" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  bolt: <path d="M13 3L4 14h6l-1 7 9-11h-6l1-7z" />,
  calendar: <path d="M4 6h16v14H4V6zm0-2h16v2H4V4zm4-2v4m8-4v4M4 10h16" />,
  gauge: <path d="M12 4a8 8 0 018 8H4a8 8 0 018-8zm0 8l4-3" />,
  link: <path d="M9 15l6-6M8 13l-2 2a3 3 0 004 4l2-2m0-10l2-2a3 3 0 014 4l-2 2" />,
  layers: <path d="M12 3l9 5-9 5-9-5 9-5zm-9 9l9 5 9-5m-18 4l9 5 9-5" />,
  brackets: <path d="M8 4l-4 8 4 8m8-16l4 8-4 8" />,
  mail: <path d="M3 6h18v12H3V6zm0 0l9 7 9-7" />,
  globe: <path d="M12 3a9 9 0 100 18 9 9 0 000-18zm-9 9h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />,
  check: <path d="M5 13l4 4L19 7" />,
  seal: <path d="M12 3l2.2 1.8 2.8-.3 1 2.6 2.6 1-.3 2.8L22 13l-1.7 2.1.3 2.8-2.6 1-1 2.6-2.8-.3L12 23l-2.2-1.8-2.8.3-1-2.6-2.6-1 .3-2.8L2 13l1.7-2.1-.3-2.8 2.6-1 1-2.6 2.8.3L12 3zm-3.5 10l2.5 2.5 5-5.5" />,
  user: <path d="M12 4a4 4 0 100 8 4 4 0 000-8zM4 20a8 8 0 0116 0" />,
  bank: <path d="M3 9l9-5 9 5v1H3V9zm2 3v6m4.7-6v6m4.6-6v6M19 12v6M3 20h18" />,
  refresh: <path d="M4 11a8 8 0 0114-4l2 2m0-5v5h-5M20 13a8 8 0 01-14 4l-2-2m0 5v-5h5" />,
  help: <path d="M12 3a9 9 0 100 18 9 9 0 000-18zm-2.5 6.5a2.5 2.5 0 115 .7c-.6 1-2 1.3-2.3 2.6l-.1.7m0 3h.01" />,
  share: <path d="M18 5a2 2 0 11-4 0 2 2 0 014 0zM8 12a2 2 0 11-4 0 2 2 0 014 0zm10 7a2 2 0 11-4 0 2 2 0 014 0zM8.7 11l5.6-3.5M8.7 13l5.6 3.5" />,
  image: <path d="M4 5h16v14H4V5zm4.5 5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM4 16l5-5 4 4 3-3 4 4" />,
  arrowUp: <path d="M12 19V5m-6 6l6-6 6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  history: <path d="M4 5v5h5M4.6 10A8 8 0 114 14m8-6v4l3 2" />,
  pencil: <path d="M4 20l1-4L16 5l3 3L8 19l-4 1zm10-13l3 3" />,
  info: <path d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 5h.01M11 12h1v5h1" />,
  logout: <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l-5-5 5-5m-5 5h13" />,
  userPlus: <path d="M12 4a4 4 0 100 8 4 4 0 000-8zM4 20a8 8 0 0113-6.3M18 14v6m-3-3h6" />,
}

export default function Icon({ name, size = 18, className = '', strokeWidth = 1.75 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] ?? null}
    </svg>
  )
}
