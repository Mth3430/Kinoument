export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: inherit;
            color: inherit;
          }
          * {
            box-sizing: border-box;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}