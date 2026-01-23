/*! instant.page v5.2.0 - (C) 2019-2025 Alexandre Dieulot - https://instant.page/license */

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

// Default hover delay in milliseconds before triggering prefetch
// Balances between user experience and false positives
// 65ms allows detection of intentional hover vs. cursor passing through
// Average hover-to-click time is 200-300ms, giving plenty of time to prefetch
// Research: Nielsen Norman Group, "Response Times: The 3 Important Limits"
const DEFAULT_HOVER_DELAY_MS = 65

// Maximum number of URLs to remember as prefetched
// Prevents unbounded memory growth on long-running sessions (SPAs)
// When limit reached, oldest entry is removed (FIFO)
// Value chosen to balance memory usage (~23KB for 100 URLs) vs. duplicate prevention
const MAX_PREFETCH_HISTORY = 100

// Minimum Chromium version for Vary: Accept header support
// Chromium 79-109 sent different Accept headers for prefetch vs. navigation
// This caused prefetched responses to be unusable due to Vary: Accept
// Fixed in Chromium 110+
// Affects Shopify sites and others using Vary: Accept
const MIN_CHROMIUM_VERSION_FOR_VARY_ACCEPT = 110

// Small screen threshold in square pixels
// Used to determine if viewport prefetch should be enabled
// iPhone 14 Pro Max: 430×932 = 400,760 px² (want)
// Samsung Galaxy S22 Ultra (80% zoom): 450×965 = 434,250 px² (want)
// Small tablet: 600×960 = 576,000 px² (don't want)
// Threshold set between phone and tablet to target mobile devices only
const SMALL_SCREEN_THRESHOLD_PX2 = 450000

// Timeout for requestIdleCallback when setting up viewport prefetch
// Ensures IntersectionObserver is set up even if browser never goes idle
// 1500ms chosen as reasonable delay that won't impact user experience
const IDLE_CALLBACK_TIMEOUT_MS = 1500

// Maximum time window for touch-triggered mouse events
// Mobile browsers send compatibility mouse events 0-1450ms after touch
// Tested up to 1450ms on overwhelmed Samsung Galaxy S2
// 2500ms provides margin while staying under "grab mouse" time (~2s)
// Used to prevent double-prefetch on touch devices
const TOUCH_EVENT_WINDOW_MS = 2500

// ============================================================================
// MODULE STATE
// ============================================================================

let _chromiumMajorVersionInUserAgent = null
  , _speculationRulesType
  , _allowQueryString
  , _allowExternalLinks
  , _useWhitelist
  , _delayOnHover = DEFAULT_HOVER_DELAY_MS
  , _lastTouchstartEvent
  , _mouseoverTimer
  , _preloadedList = new Set()

init()

/**
 * Initializes instant.page prefetch functionality
 *
 * Performs browser compatibility checks, detects Chromium version, configures
 * speculation rules support, and sets up event listeners based on intensity mode.
 *
 * Browser requirements:
 * - Chromium ≥100, Firefox ≥115, or Safari ≥15.4
 * - Prefetch API support (link rel="prefetch")
 *
 * Configuration via data attributes on <body>:
 * - data-instant-intensity: hover delay (ms), "mousedown", "mousedown-only", "viewport", "viewport-all"
 * - data-instant-allow-query-string: enable prefetch for URLs with query params
 * - data-instant-allow-external-links: enable cross-origin prefetch (Chromium only)
 * - data-instant-whitelist: only prefetch links with data-instant attribute
 * - data-instant-mousedown-shortcut: enable immediate navigation on mousedown
 * - data-instant-vary-accept: handle Vary: Accept header (Shopify compatibility)
 * - data-instant-specrules: "prerender", "prefetch", or "no" for speculation rules
 *
 * @returns {void} Returns early if browser is unsupported or incompatible
 */
function init() {
  const supportChecksRelList = document.createElement('link').relList

  const supportsPrefetch = supportChecksRelList.supports('prefetch')
  if (!supportsPrefetch) {
    return
  }

  const chromium100Check = 'throwIfAborted' in AbortSignal.prototype // Chromium 100+, Safari 15.4+, Firefox 97+
  const firefox115AndSafari17_0Check = supportChecksRelList.supports('modulepreload') // Firefox 115+, Safari 17.0+, Chromium 66+
  const safari15_4AndFirefox116Check = Intl.PluralRules && 'selectRange' in Intl.PluralRules.prototype // Safari 15.4+, Firefox 116+, Chromium 106+
  const firefox115AndSafari15_4Check = firefox115AndSafari17_0Check || safari15_4AndFirefox116Check
  const isBrowserSupported = chromium100Check && firefox115AndSafari15_4Check
  if (!isBrowserSupported) {
    return
  }
  // In order to lessen maintenance and unnoticed bugs we only support:
  // - Chromium ⩾ 100 — UC Browser 14
  // - Gecko as in Firefox ⩾ 115 — last version supported on Windows 7
  // - WebKit as in Safari ⩾ 15.4 — last major WebKit version supported on iPhone 6s & 7
  //
  // WebKit doesn’t support prefetch anyway, but instant.page might
  // eventually drop this requirement by providing an option for
  // fetch()-based preloading.
  //
  // Additionally, instant.page should not cause JavaScript errors in:
  // - Chromium ⩾ 61
  // - Gecko as in Firefox ⩾ 60
  // - WebKit as in Safari ⩾ 10.1 (iOS ⩾ 10.3 and macOS ⩾ 10.10)
  // Browser engines older than that don’t support <script type=module>
  // and thus don’t load instant.page at all.

  const handleVaryAcceptHeader = 'instantVaryAccept' in document.body.dataset || 'Shopify' in window
  // The `Vary: Accept` header when received in Chromium 79–109 makes prefetches
  // unusable, as Chromium used to send a different `Accept` header.
  // It’s applied on all Shopify sites by default, as Shopify is very popular
  // and is the main source of this problem.
  // `window.Shopify` only exists on “classic” Shopify sites. Those using
  // Hydrogen (Remix SPA) aren’t concerned.

  const chromiumUserAgentIndex = navigator.userAgent.indexOf('Chrome/')
  if (chromiumUserAgentIndex > -1) {
    _chromiumMajorVersionInUserAgent = parseInt(navigator.userAgent.substring(chromiumUserAgentIndex + 'Chrome/'.length))
  }
  // The user agent client hints API is a theoretically more reliable way to
  // get Chromium’s version… but it’s not available in Samsung Internet 20.
  // It also requires a secure context, which would make debugging harder,
  // and is only available in recent Chromium versions.
  // In practice, Chromium browsers never shy from announcing "Chrome" in
  // their regular user agent string, as that maximizes their compatibility.

  if (handleVaryAcceptHeader && _chromiumMajorVersionInUserAgent && _chromiumMajorVersionInUserAgent < MIN_CHROMIUM_VERSION_FOR_VARY_ACCEPT) {
    return
  }

  _speculationRulesType = 'none'
  if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
    const speculationRulesConfig = document.body.dataset.instantSpecrules
    if (speculationRulesConfig === 'prerender') {
      _speculationRulesType = 'prerender'
    } else if (speculationRulesConfig !== 'no') {
      _speculationRulesType = 'prefetch'
    }
  }

  const useMousedownShortcut = 'instantMousedownShortcut' in document.body.dataset
  _allowQueryString = 'instantAllowQueryString' in document.body.dataset
  _allowExternalLinks = 'instantAllowExternalLinks' in document.body.dataset
  _useWhitelist = 'instantWhitelist' in document.body.dataset

  let preloadOnMousedown = false
  let preloadOnlyOnMousedown = false
  let preloadWhenVisible = false
  if ('instantIntensity' in document.body.dataset) {
    const intensityParameter = document.body.dataset.instantIntensity

    if (intensityParameter === 'mousedown' && !useMousedownShortcut) {
      preloadOnMousedown = true
    }

    if (intensityParameter === 'mousedown-only' && !useMousedownShortcut) {
      preloadOnMousedown = true
      preloadOnlyOnMousedown = true
    }

    if (intensityParameter === 'viewport') {
      const isOnSmallScreen = document.documentElement.clientWidth * document.documentElement.clientHeight < SMALL_SCREEN_THRESHOLD_PX2
      // Smartphones are the most likely to have a slow connection, and
      // their small screen size limits the number of links (and thus
      // server load).
      //
      // Foldable phones (being expensive as of 2023), tablets and PCs
      // generally have a decent connection, and a big screen displaying
      // more links that would put more load on the server.
      //
      // iPhone 14 Pro Max (want): 430×932 = 400 760
      // Samsung Galaxy S22 Ultra with display size set to 80% (want):
      // 450×965 = 434 250
      // Small tablet (don’t want): 600×960 = 576 000
      // Those number are virtual screen size, the viewport (used for
      // the check above) will be smaller with the browser’s interface.

      const isNavigatorConnectionSaveDataEnabled = navigator.connection && navigator.connection.saveData
      const isNavigatorConnectionLike2g = navigator.connection && navigator.connection.effectiveType && navigator.connection.effectiveType.includes('2g')
      const isNavigatorConnectionAdequate = !isNavigatorConnectionSaveDataEnabled && !isNavigatorConnectionLike2g

      if (isOnSmallScreen && isNavigatorConnectionAdequate) {
        preloadWhenVisible = true
      }
    }

    if (intensityParameter === 'viewport-all') {
      preloadWhenVisible = true
    }

    const intensityAsInteger = parseInt(intensityParameter)
    if (!isNaN(intensityAsInteger)) {
      _delayOnHover = intensityAsInteger
    }
  }

  const eventListenersOptions = {
    capture: true,
    passive: true,
  }

  if (preloadOnlyOnMousedown) {
    document.addEventListener('touchstart', touchstartEmptyListener, eventListenersOptions)
  }
  else {
    document.addEventListener('touchstart', touchstartListener, eventListenersOptions)
  }

  if (!preloadOnMousedown) {
    document.addEventListener('mouseover', mouseoverListener, eventListenersOptions)
  }

  if (preloadOnMousedown) {
    document.addEventListener('mousedown', mousedownListener, eventListenersOptions)
  }
  if (useMousedownShortcut) {
    document.addEventListener('mousedown', mousedownShortcutListener, eventListenersOptions)
  }

  if (preloadWhenVisible) {
    let requestIdleCallbackOrFallback = window.requestIdleCallback
    // Safari has no support as of 16.3: https://webkit.org/b/164193
    if (!requestIdleCallbackOrFallback) {
      requestIdleCallbackOrFallback = (callback) => {
        callback()
        // A smarter fallback like setTimeout is not used because devices that
        // may eventually be eligible to a Safari version supporting prefetch
        // will be very powerful.
        // The weakest devices that could be eligible are the 2017 iPad and
        // the 2016 MacBook.
      }
    }

    requestIdleCallbackOrFallback(function observeIntersection() {
      const intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const anchorElement = entry.target
            intersectionObserver.unobserve(anchorElement)
            preload(anchorElement.href)
          }
        })
      })

      document.querySelectorAll('a').forEach((anchorElement) => {
        if (isPreloadable(anchorElement)) {
          intersectionObserver.observe(anchorElement)
        }
      })
    }, {
      timeout: IDLE_CALLBACK_TIMEOUT_MS,
    })
  }
}

/**
 * Handles touchstart events for prefetching on touch devices
 *
 * Stores touch event properties (avoiding event pooling) and triggers prefetch
 * with high priority if the touched element is a preloadable link.
 *
 * Note: Stores only target and timeStamp to avoid event pooling issues where
 * browsers reuse event objects.
 *
 * @param {TouchEvent} event - The touchstart event
 * @returns {void}
 */
function touchstartListener(event) {
  // Store only necessary properties to avoid event pooling issues
  // Browsers may reuse event objects, invalidating stored references
  _lastTouchstartEvent = {
    target: event.target,
    timeStamp: event.timeStamp
  }

  const anchorElement = event.target.closest('a')

  if (!isPreloadable(anchorElement)) {
    return
  }

  preload(anchorElement.href, 'high')
}

/**
 * Handles touchstart events when in mousedown-only mode
 *
 * Stores touch event properties without triggering prefetch, used only to enable
 * touch detection in isEventLikelyTriggeredByTouch() for mousedown-only intensity.
 *
 * @param {TouchEvent} event - The touchstart event
 * @returns {void}
 */
function touchstartEmptyListener(event) {
  // Store only necessary properties to avoid event pooling issues
  _lastTouchstartEvent = {
    target: event.target,
    timeStamp: event.timeStamp
  }
}

/**
 * Handles mouseover events for hover-based prefetching
 *
 * Triggers prefetch after a configurable delay (default 65ms) to distinguish
 * intentional hovers from cursor passing through. Skips processing if the
 * event was triggered by a touch (compatibility mouse event).
 *
 * Sets up a mouseout listener (with once:true) to cancel prefetch if user
 * moves away before the delay expires.
 *
 * @param {MouseEvent} event - The mouseover event
 * @returns {void} Returns early if event is touch-triggered or target lacks closest()
 */
function mouseoverListener(event) {
  if (isEventLikelyTriggeredByTouch(event)) {
    // This avoids uselessly adding a mouseout event listener and setting a timer.
    return
  }

  if (!('closest' in event.target)) {
    return
    // Without this check sometimes an error “event.target.closest is not a function” is thrown, for unknown reasons
    // That error denotes that `event.target` isn’t undefined. My best guess is that it’s the Document.
    //
    // Details could be gleaned from throwing such an error:
    //throw new TypeError(`instant.page non-element event target: timeStamp=${~~event.timeStamp}, type=${event.type}, typeof=${typeof event.target}, nodeType=${event.target.nodeType}, nodeName=${event.target.nodeName}, viewport=${innerWidth}x${innerHeight}, coords=${event.clientX}x${event.clientY}, scroll=${scrollX}x${scrollY}`)
  }
  const anchorElement = event.target.closest('a')

  if (!isPreloadable(anchorElement)) {
    return
  }

  anchorElement.addEventListener('mouseout', mouseoutListener, {passive: true, once: true})

  _mouseoverTimer = setTimeout(() => {
    preload(anchorElement.href, 'high')
    _mouseoverTimer = null
  }, _delayOnHover)
}

/**
 * Handles mousedown events for mousedown-intensity prefetching
 *
 * Triggers prefetch when mouse button is pressed (before click), providing
 * 100-200ms head start. Skips processing if event is touch-triggered.
 *
 * @param {MouseEvent} event - The mousedown event
 * @returns {void} Returns early if event is touch-triggered or not preloadable
 */
function mousedownListener(event) {
  if (isEventLikelyTriggeredByTouch(event)) {
    // When preloading only on mousedown, not touch, we need to stop there
    // because touches send compatibility mouse events including mousedown.
    //
    // (When preloading on touchstart, instructions below this block would
    // have no effect.)
    return
  }

  const anchorElement = event.target.closest('a')

  if (!isPreloadable(anchorElement)) {
    return
  }

  preload(anchorElement.href, 'high')
}

/**
 * Handles mouseout events to cancel pending prefetch timers
 *
 * Clears the hover delay timer if user moves cursor away from a link before
 * the delay expires. Checks if mouseout is within the same link (moving between
 * child elements) and ignores those cases.
 *
 * Automatically removed after first invocation (once:true listener).
 *
 * @param {MouseEvent} event - The mouseout event
 * @returns {void} Returns early if moving within same link element
 */
function mouseoutListener(event) {
  if (event.relatedTarget && event.target.closest('a') === event.relatedTarget.closest('a')) {
    return
  }

  if (_mouseoverTimer) {
    clearTimeout(_mouseoverTimer)
    _mouseoverTimer = null
  }
}

/**
 * Handles mousedown events for instant navigation shortcut
 *
 * Immediately dispatches a synthetic click event on mousedown, eliminating the
 * ~100ms delay between mousedown and click. Uses a magic detail value (1337)
 * to distinguish synthetic clicks from real ones.
 *
 * Prevents the real click event to avoid double navigation. Only runs on actual
 * mouse clicks (not touch-triggered, not modifier keys, left button only).
 *
 * @param {MouseEvent} event - The mousedown event
 * @returns {void} Returns early if touch-triggered, wrong button, or modifiers pressed
 */
function mousedownShortcutListener(event) {
  if (isEventLikelyTriggeredByTouch(event)) {
    // Due to a high potential for complications with this mousedown shortcut
    // combined with other parties’ JavaScript code, we don’t want it to run
    // at all on touch devices, even though mousedown and click are triggered
    // at almost the same time on touch.
    return
  }

  const anchorElement = event.target.closest('a')

  if (event.which > 1 || event.metaKey || event.ctrlKey) {
    return
  }

  if (!anchorElement) {
    return
  }

  anchorElement.addEventListener('click', function (event) {
    if (event.detail === 1337) {
      return
    }

    event.preventDefault()
  }, {capture: true, passive: false, once: true})

  const customEvent = new MouseEvent('click', {view: window, bubbles: true, cancelable: false, detail: 1337})
  anchorElement.dispatchEvent(customEvent)
}

/**
 * Determines if a mouse event was triggered by a touch (compatibility event)
 *
 * Touch devices fire "mouseover", "mousedown", and other mouse events after
 * touch events for compatibility with mouse-only code. This function detects
 * such events to avoid double-prefetching on touch devices.
 *
 * Detection logic:
 * - Compares event target with last touchstart target
 * - Checks if event timestamp is within TOUCH_EVENT_WINDOW_MS (2500ms)
 * - Tested on Samsung Galaxy S2 (up to 1450ms delay observed)
 *
 * False positives are acceptable (skip prefetch unnecessarily) but false negatives
 * could cause issues in mousedownShortcutListener (double navigation).
 *
 * @param {MouseEvent} event - The mouse event to check
 * @returns {boolean} True if event is likely triggered by a touch
 */
function isEventLikelyTriggeredByTouch(event) {
  // Touch devices fire “mouseover” and “mousedown” (and other) events after
  // a touch for compatibility reasons.
  // This function checks if it’s likely that we’re dealing with such an event.

  if (!_lastTouchstartEvent || !event) {
    return false
  }

  if (event.target !== _lastTouchstartEvent.target) {
    return false
  }

  const now = event.timeStamp
  // Chromium (tested Chrome 95 and 122 on Android) sometimes uses the same
  // event.timeStamp value in touchstart, mouseover, and mousedown.
  // Testable in test/extras/delay-not-considered-touch.html
  // This is okay for our purpose: two equivalent timestamps will be less
  // than the max duration, which means they’re related events.
  // TODO: fill/find Chromium bug
  const durationBetweenLastTouchstartAndNow = now - _lastTouchstartEvent.timeStamp

  const MAX_DURATION_TO_BE_CONSIDERED_TRIGGERED_BY_TOUCHSTART = TOUCH_EVENT_WINDOW_MS
  // How long after a touchstart event can a simulated mouseover/mousedown event fire?
  // /test/extras/delay-not-considered-touch.html tries to answer that question.
  // I saw up to 1450 ms on an overwhelmed Samsung Galaxy S2.
  // On the other hand, how soon can an unrelated mouseover event happen after an unrelated touchstart?
  // Meaning the user taps a link, then grabs their pointing device and clicks another/the same link.
  // That scenario could occur if a user taps a link, thinks it hasn’t worked, and thus fall back to their pointing device.
  // I do that in about 1200 ms on a Chromebook. In which case this function returns a false positive.
  // False positives are okay, as this function is only used to decide to abort handling mouseover/mousedown/mousedownShortcut.
  // False negatives could lead to unforeseen state, particularly in mousedownShortcutListener.

  return durationBetweenLastTouchstartAndNow < MAX_DURATION_TO_BE_CONSIDERED_TRIGGERED_BY_TOUCHSTART

  // TODO: Investigate if pointer events could be used.
  // https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pointerType

  // TODO: Investigate if InputDeviceCapabilities could be used to make it
  // less hacky on Chromium browsers.
  // https://developer.mozilla.org/en-US/docs/Web/API/InputDeviceCapabilities_API
  // https://wicg.github.io/input-device-capabilities/
  // Needs careful reading of the spec and tests (notably, what happens with a
  // mouse connected to an Android or iOS smartphone?) to make sure it’s solid.
  // Also need to judge if WebKit could implement it differently, as they
  // don’t mind doing when a spec gives room to interpretation.
  // It seems to work well on Chrome on ChromeOS.

  // TODO: Consider using event screen position as another heuristic.
}

/**
 * Checks if an anchor element is eligible for prefetching
 *
 * Validates against multiple criteria:
 * - Element and href exist
 * - Whitelist mode: requires data-instant attribute
 * - Origin: same-origin only (unless explicitly allowed for external)
 * - Protocol: only HTTP/HTTPS (no javascript:, file:, data:, etc.)
 * - Security: no HTTPS→HTTP downgrade
 * - Query strings: blocked by default (unless explicitly allowed)
 * - Same-page anchors: excluded (hash-only navigation)
 * - Blacklist: respects data-no-instant attribute
 *
 * @param {HTMLAnchorElement|null} anchorElement - The anchor element to check
 * @returns {boolean|undefined} True if preloadable, undefined/false otherwise
 */
function isPreloadable(anchorElement) {
  if (!anchorElement || !anchorElement.href) {
    return
  }

  if (_useWhitelist && !('instant' in anchorElement.dataset)) {
    return
  }

  if (anchorElement.origin !== location.origin) {
    let allowed = _allowExternalLinks || 'instant' in anchorElement.dataset
    if (!allowed || !_chromiumMajorVersionInUserAgent) {
      // Chromium-only: see comment on "restrictive prefetch" and "cross-site speculation rules prefetch"
      return
    }
  }

  if (!['http:', 'https:'].includes(anchorElement.protocol)) {
    return
  }

  if (anchorElement.protocol === 'http:' && location.protocol === 'https:') {
    return
  }

  if (!_allowQueryString && anchorElement.search && !('instant' in anchorElement.dataset)) {
    return
  }

  if (anchorElement.hash && anchorElement.pathname + anchorElement.search === location.pathname + location.search) {
    return
  }

  if ('noInstant' in anchorElement.dataset) {
    return
  }

  return true
}

/**
 * Prefetches a URL for faster subsequent navigation
 *
 * Implements FIFO cache (MAX_PREFETCH_HISTORY limit) to prevent memory growth.
 * Uses Speculation Rules API when available, falls back to link prefetch element.
 *
 * Cache eviction:
 * - Tracks up to 100 unique URLs (configurable via MAX_PREFETCH_HISTORY)
 * - When full, removes oldest entry before adding new one
 * - Prevents duplicate prefetches via Set.has() check
 *
 * @param {string} url - The absolute URL to prefetch
 * @param {string} [fetchPriority='auto'] - Fetch priority: 'high' (touch/mouse) or 'auto' (viewport)
 * @returns {void} Returns early if URL already prefetched
 */
function preload(url, fetchPriority = 'auto') {
  if (_preloadedList.has(url)) {
    return
  }

  // Implement FIFO cache eviction to prevent unbounded memory growth
  // Sets maintain insertion order, so we can remove the first (oldest) entry
  if (_preloadedList.size >= MAX_PREFETCH_HISTORY) {
    const oldestUrl = _preloadedList.values().next().value
    _preloadedList.delete(oldestUrl)
  }

  if (_speculationRulesType !== 'none') {
    preloadUsingSpeculationRules(url)
  } else {
    preloadUsingLinkElement(url, fetchPriority)
  }

  _preloadedList.add(url)
}

/**
 * Prefetches URL using Speculation Rules API (modern method)
 *
 * Creates a <script type="speculationrules"> element with JSON configuration.
 * Supports both prefetch and prerender modes (configured via data-instant-specrules).
 *
 * Advantages over link prefetch:
 * - Better cross-origin support (no cookies requirement in some cases)
 * - Prerender capability (full page rendering)
 * - More explicit browser intent
 *
 * Browser support: Chromium 103+, Safari 17.0+ (prefetch only)
 *
 * Note: Script elements accumulate in <head>. This is acceptable as the browser
 * manages the actual prefetch queue and limits.
 *
 * @param {string} url - The absolute URL to prefetch
 * @returns {void}
 */
function preloadUsingSpeculationRules(url) {
  const scriptElement = document.createElement('script')
  scriptElement.type = 'speculationrules'

  scriptElement.textContent = JSON.stringify({
    [_speculationRulesType]: [{
      source: 'list',
      urls: [url]
    }]
  })

  // When using speculation rules, cross-site prefetch is supported, but will
  // only work if the user has no cookies for the destination site. The
  // prefetch will not be sent, if the user does have such cookies.

  document.head.appendChild(scriptElement)
}

/**
 * Prefetches URL using <link rel="prefetch"> element (fallback method)
 *
 * Creates a link element in <head> with prefetch relationship. Uses as="document"
 * for Chromium to enable "restrictive prefetch" (cross-origin with cookies).
 *
 * Fetch priority:
 * - 'high': User-triggered (touch/mouse) - steals bandwidth from other resources
 * - 'auto': Viewport-triggered - uses default low priority
 *
 * Note on as="document":
 * Chromium-specific feature enabling cross-origin prefetch. Chrome team plans to
 * deprecate in favor of Speculation Rules API. Works well for now.
 *
 * Browser support: All browsers with prefetch support (Chromium, Firefox)
 *
 * @param {string} url - The absolute URL to prefetch
 * @param {string} [fetchPriority='auto'] - Fetch priority: 'high' or 'auto'
 * @returns {void}
 */
function preloadUsingLinkElement(url, fetchPriority = 'auto') {
  const linkElement = document.createElement('link')
  linkElement.rel = 'prefetch'
  linkElement.href = url

  linkElement.fetchPriority = fetchPriority
  // By default, a prefetch is loaded with a low priority.
  // When there’s a fair chance that this prefetch is going to be used in the
  // near term (= after a touch/mouse event), giving it a high priority helps
  // make the page load faster in case there are other resources loading.
  // Prioritizing it implicitly means deprioritizing every other resource
  // that’s loading on the page. Due to HTML documents usually being much
  // smaller than other resources (notably images and JavaScript), and
  // prefetches happening once the initial page is sufficiently loaded,
  // this theft of bandwidth should rarely be detrimental.

  linkElement.as = 'document'
  // as=document is Chromium-only and allows cross-origin prefetches to be
  // usable for navigation. They call it “restrictive prefetch” and intend
  // to remove it: https://crbug.com/1352371
  //
  // This document from the Chrome team dated 2022-08-10
  // https://docs.google.com/document/d/1x232KJUIwIf-k08vpNfV85sVCRHkAxldfuIA5KOqi6M
  // claims (I haven’t tested) that data- and battery-saver modes as well as
  // the setting to disable preloading do not disable restrictive prefetch,
  // unlike regular prefetch. That’s good for prefetching on a touch/mouse
  // event, but might be bad when prefetching every link in the viewport.

  document.head.appendChild(linkElement)
}
