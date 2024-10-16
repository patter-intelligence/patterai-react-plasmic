import { Html, Head, Main, NextScript } from 'next/document'
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <title>Patter AI</title>
        <link rel="icon" type="image/x-icon" href="favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <body>
        <Main />
        <NextScript />
        <script dangerouslySetInnerHTML={{
          __html: `
            (function () {
              const messageQueue = {};
              let messageId = 0;

              function generateMessageId() {
                return \`msg_\${messageId++}\`;
              }

              function sendMessage(type, payload, timeout = 30000) {
                return new Promise((resolve, reject) => {
                  const id = generateMessageId();
                  const timeoutId = setTimeout(() => {
                    if (messageQueue[id]) {
                      delete messageQueue[id];
                      reject(new Error(\`Request timed out after \${timeout}ms\`));
                    }
                  }, timeout);

                  messageQueue[id] = {
                    resolve: (value) => {
                      clearTimeout(timeoutId);
                      resolve(value);
                    },
                    reject: (error) => {
                      clearTimeout(timeoutId);
                      reject(error);
                    },
                  };
                  window.parent.postMessage({ id, type, payload }, '*');
                });
              }

              window.addEventListener('message', (event) => {
                const { id, type, payload, error } = event.data;
                if (messageQueue[id]) {
                  if (error) {
                    messageQueue[id].reject(new Error(error));
                  } else {
                    messageQueue[id].resolve(payload);
                  }
                  delete messageQueue[id];
                }
              });

              window.__salesforce__ = {
                callApexMethod: (methodName, params) =>
                  sendMessage('callApexMethod', { methodName, params }),
                getObjectInfo: (params) => sendMessage('getObjectInfo', { params }),
                upsert: (params) => sendMessage('upsert', { params }),
                delete: (params) => sendMessage('delete', { params }),
                query: (params) => sendMessage('query', { params }),
                updateCurrentSlide: (params) =>
                  sendMessage('updateCurrentSlide', { params }),
              };

              // Notify parent that the app is ready
              window.parent.postMessage(
                {
                  type: 'ready',
                  payload: {
                    appName: 'shell',
                    version: '1.0.0',
                  },
                },
                '*'
              );
            })();
          `
        }} />
      </body>
    </Html>
  )
}
