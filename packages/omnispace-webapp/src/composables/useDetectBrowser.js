export function useDetectBrowser() {
  // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
  const isOpera = !!window.opera || navigator.userAgent.indexOf(" OPR/") >= 0;
  // Firefox 1.0+
  const isEdge = /Edg/.test(navigator.userAgent);
  const isFirefox = /Firefox/.test(navigator.userAgent);
  // Safari 3.0+
  /*eslint-disable */
  const isSafari =
    /constructor/i.test(window.HTMLElement) ||
    (function (p) {
      return p.toString() === "[object SafariRemoteNotification]";
    })(!window["safari"] || safari.pushNotification);
  /*eslint-enable */
  // Internet Explorer 6-11
  const isIE = /*@cc_on!@*/ false || !!document.documentMode;
  // Edge 20+

  const isChrome = /Google Inc/.test(navigator.vendor) && !isEdge;
  const isChromeIOS = /CriOS/.test(navigator.userAgent);
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const isBrave = typeof navigator.brave !== "undefined";

  return {
    isOpera,
    isEdge,
    isFirefox,
    isSafari,
    isIE,
    isChrome,
    isChromeIOS,
    isIOS,
    isBrave,
  };
}
