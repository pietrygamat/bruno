const { BrowserWindow } = require('electron');

const openNewWindow = (session) => {
  let allOpenWindows = BrowserWindow.getAllWindows();

  // main window id is '1'
  // get all other windows
  let windowsExcludingMain = allOpenWindows.filter((w) => w.id != 1);
  windowsExcludingMain.forEach((w) => {
    w.close();
  });

  const window = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      partition: session
    },
    show: false
  });

  window.on('ready-to-show', window.show.bind(window));
  return window;
};

const authorizeUserInWindow = ({ authorizeUrl, callbackUrl, session }) => {
  return new Promise(async (resolve, reject) => {
    let finalUrl = null;

    let window = openNewWindow(session);

    function onWindowRedirect(url) {
      // check if the url contains an authorization code
      if (new URL(url).searchParams.has('code')) {
        finalUrl = url;
        if (!url || !finalUrl.includes(callbackUrl)) {
          reject(new Error('Invalid Callback Url'));
        }
        window.close();
      }
      if (url.match(/(error=).*/) || url.match(/(error_description=).*/) || url.match(/(error_uri=).*/)) {
        const _url = new URL(url);
        const error = _url.searchParams.get('error');
        const errorDescription = _url.searchParams.get('error_description');
        const errorUri = _url.searchParams.get('error_uri');
        let errorData = {
          message: 'Authorization Failed!',
          error,
          errorDescription,
          errorUri
        };
        reject(new Error(JSON.stringify(errorData)));
        window.close();
      }
    }

    window.on('close', () => {
      if (finalUrl) {
        try {
          const callbackUrlWithCode = new URL(finalUrl);
          const authorizationCode = callbackUrlWithCode.searchParams.get('code');

          return resolve({ authorizationCode });
        } catch (error) {
          return reject(error);
        }
      } else {
        return reject(new Error('Authorization window closed'));
      }
    });

    // wait for the window to navigate to the callback url
    const didNavigateListener = (_, url) => {
      onWindowRedirect(url);
    };
    window.webContents.on('did-navigate', didNavigateListener);
    const willRedirectListener = (_, authorizeUrl) => {
      onWindowRedirect(authorizeUrl);
    };
    window.webContents.on('will-redirect', willRedirectListener);

    try {
      await window.loadURL(authorizeUrl);
    } catch (error) {
      // If browser redirects before load finished, loadURL throws an error with code ERR_ABORTED. This should be ignored.
      if (error.code === 'ERR_ABORTED') {
        console.debug('Ignoring ERR_ABORTED during authorizeUserInWindow');
        return;
      }
      reject(error);
      window.close();
    }
  });
};

const authorizeUserInWindowImplicit = ({ authorizeUrl, callbackUrl, session }) => {
  return new Promise(async (resolve, reject) => {
    let finalUrl = null;

    let window = openNewWindow(session);

    function onWindowRedirect(url) {
      // check if the url contains an access token
      if (new URLSearchParams(new URL(url).hash.slice(1)).has('access_token')) {
        finalUrl = url;
        window.close();
      }
      if (url.match(/(error=).*/) || url.match(/(error_description=).*/) || url.match(/(error_uri=).*/)) {
        const _url = new URL(url);
        const error = _url.searchParams.get('error');
        const errorDescription = _url.searchParams.get('error_description');
        const errorUri = _url.searchParams.get('error_uri');
        let errorData = {
          message: 'Authorization Failed!',
          error,
          errorDescription,
          errorUri
        };
        reject(new Error(JSON.stringify(errorData)));
        window.close();
      }
    }

    window.on('close', () => {
      if (finalUrl) {
        try {
          const uriFragmentWithToken = new URLSearchParams(new URL(finalUrl).hash.slice(1));
          const accessToken = uriFragmentWithToken.get('access_token');
          return resolve({ accessToken });
        } catch (error) {
          return reject(error);
        }
      } else {
        return reject(new Error('Authorization window closed'));
      }
    });

    // wait for the window to navigate to the callback url
    const didNavigateListener = (_, url) => {
      onWindowRedirect(url);
    };
    window.webContents.on('did-navigate', didNavigateListener);
    const willRedirectListener = (_, authorizeUrl) => {
      onWindowRedirect(authorizeUrl);
    };
    window.webContents.on('will-redirect', willRedirectListener);

    try {
      await window.loadURL(authorizeUrl);
    } catch (error) {
      reject(error);
      window.close();
    }
  });
};

module.exports = {
  authorizeUserInWindow,
  authorizeUserInWindowImplicit
};
