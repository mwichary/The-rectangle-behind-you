'use strict';

// Current slide number
var currentSlideNumber = 0
// Maximum slide number seen so far. Used to communicate with the companion site.
var maxSlideNumber = 0
// Whether to skip less important slides or not (https://medium.com/p/63afe6c72e09)
var skipLessImportantSlides = false
// All the slide elements
var slideEls


// General slide logic
// --------------------------------------------------------------------------
function showSlide() {
  var els = document.querySelectorAll('.presentation > div.visible')
  els.forEach(function(el) {
    el.classList.remove('visible')
  })

  slideEls[currentSlideNumber].classList.add('visible')

  updateUrlFragment()
}

/*
 * Clean up right after the slide disappears.
 */
function onSlideLeave(slideEl) {
  // Stop playing video and rewind it for future use
  if (slideEl.querySelector('video')) {
    var el = slideEl.querySelector('video')
    el.pause()
    el.currentTime = 0
  }

  // Unload the iframe for better performance
  if (slideEl.querySelector('iframe') && slideEl.querySelector('iframe').classList.contains('loaded')) {
    slideEl.querySelector('iframe').src = 'about:blank'
    slideEl.querySelector('iframe').classList.remove('loaded')
  }

  slideEl.getAttribute('onslideleave') && eval(slideEl.getAttribute('onslideleave'))
}

/**
 * Load iframe on a given slide, if any
 */
function loadIframes(slideEl) {
  if (slideEl.querySelector('iframe') && !slideEl.querySelector('iframe').classList.contains('loaded')) {
    slideEl.querySelector('iframe').src = slideEl.querySelector('iframe').getAttribute('data-src')
    slideEl.querySelector('iframe').classList.add('loaded')
  }
}

/**
 * Prepare the slide just ahead of the next slide.
 */
function onSlidePreEnter(slideEl) {
  // Load video if it’s on the slide
  if (slideEl.querySelector('video')) {
    var el = slideEl.querySelector('video')
    el.load()
  }

  loadIframes(slideEl)
}

/**
 * Prepare the slide that just became visible.
 */
function onSlideEnter(slideEl, instant) {
  // Play video if it’s on the slide
  if (slideEl.querySelector('video')) {
    var el = slideEl.querySelector('video')

    el.load()
    el.play()
  }

  // Doing it again, even though we did it in onSlidePreEntry, so that the presenter
  // can safely refresh
  loadIframes(slideEl)

  // Focus on things if so requested
  if (!instant && slideEl.classList.contains('focus-after-transition')) {
    slideEl.querySelector('iframe') && slideEl.querySelector('iframe').focus()
    slideEl.querySelector('input') && slideEl.querySelector('input').focus()
  }

  slideEl.getAttribute('onslideenter') && eval(slideEl.getAttribute('onslideenter'))

  // Play animations if any
  var els = slideEl.querySelectorAll('.animate-on-enter:not(.animate)')
  els.forEach(function(el) {
    window.setTimeout(function() {
      el.classList.add('animate')
    }, 0)
  })
}

/**
 * Go to the next slide.
 * @param bool instant Whether it should skip all the transitions (true) or not
 */
function nextSlide(instant) {
  if (currentSlideNumber < slideEls.length - 1) {
    onSlideLeave(slideEls[currentSlideNumber])
    currentSlideNumber++

    // Skip predetermined slides if we are short on time
    while (skipLessImportantSlides && 
           slideEls[currentSlideNumber].classList.contains('skip-if-pressed-on-time')) {
      currentSlideNumber++
    }

    showSlide()
    onSlideEnter(slideEls[currentSlideNumber], instant)

    // Preload the next slide for smoother transition
    var nextSlideEl = slideEls[currentSlideNumber + 1]
    if (nextSlideEl) {
      onSlidePreEnter(nextSlideEl)
    }
  }
}

/**
 * Go to the previous slide.
 * @param bool instant Whether it should skip all the transitions (true) or not
 */
function prevSlide(instant) {
  if (currentSlideNumber > 0) {
    onSlideLeave(slideEls[currentSlideNumber])
    currentSlideNumber--

    while (skipLessImportantSlides && slideEls[currentSlideNumber].classList.contains('skip-if-pressed-on-time')) {
      currentSlideNumber--
    }

    showSlide()
    onSlideEnter(slideEls[currentSlideNumber], instant)
  }
}

/*
 * Update the page URL to include the slide number after a #
 */
function updateUrlFragment() {
  window.history.replaceState(null, '', '#' + (currentSlideNumber + 1))
}

/**
 * Get the slide number from URL fragment (on presentation load or reload)
 */
function getSlideNumberFromUrlFragment() {
  var fragment = window.location.hash || ''

  currentSlideNumber = (parseInt(fragment.substr(1)) - 1) || 0
}

/**
 * Get unique ID identifying special slides.
 */
function getCurrentSlideId() {
  return slideEls[currentSlideNumber].getAttribute('data-slide-id')
}

/* 
 * Flash an indicator (confirming to the presenter an action, e.g. pressing
 * a secret keyboard shortcut, has taken place)
 */
function flashIndicator() {
  document.querySelector('.indicator').classList.add('visible')

  window.setTimeout(function() {
    document.querySelector('.indicator').classList.remove('visible')
  }, 500)
}

function onKeyDown(event) {
  switch (event.keyCode) {
    case 189: // Minus
      if (document.activeElement == document.body) {
        skipLessImportantSlides = true
        flashIndicator()
        event.preventDefault()
      }
      break
    case 187: // Plus
      if (document.activeElement == document.body) {
        skipLessImportantSlides = false
        flashIndicator()
        event.preventDefault()
      }
      break

    case 39: // Right arrow
    case 40: // Down arrow
    case 34: // Remote next (PgDn)
      if (document.activeElement == document.body) {
        nextSlide(event.shiftKey)
        event.preventDefault()
      }
      break

    case 37: // Left arrow
    case 38: // Up arrow
    case 33: // Remote previous (PgUp)
    case 8: // Backspace
      if (document.activeElement == document.body) {
        prevSlide(event.shiftKey)
        event.preventDefault()
      }
      break
  }
}

/**
 * Main presentation entry (requested as DOM loads).
 */
function main() {
  NodeList.prototype.forEach = HTMLCollection.prototype.forEach = Array.prototype.forEach

  slideEls = document.querySelectorAll('.presentation > div')

  // Specific slide tech
  $('pre, code').each(function(i, block) {
    hljs.highlightBlock(block)
  });

  // Set up
  getSlideNumberFromUrlFragment()
  document.querySelector('.presentation').classList.add('visible')
  showSlide(true, true)
  onSlideEnter(slideEls[currentSlideNumber], true)

  document.body.addEventListener('keydown', onKeyDown)
  document.body.focus()
}
