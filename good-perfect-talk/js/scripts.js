'use strict';

NodeList.prototype.forEach = HTMLCollection.prototype.forEach = Array.prototype.forEach

// Specific slide logic: Typography details
// --------------------------------------------------------------------------
var TYPOGRAPHY_DETAILS_GOOD = [
  { x: 210, y: 455, shortcut: 'ital', title: 'Italics' },
  { x: 629, y: 116, x2: 690, y2: 116, shortcut: 'quot', title: 'Quotation marks' },
  { x: 289, y: 52, shortcut: 'prim', title: 'Primes' },
  { x: 76, y: 453, shortcut: 'hang', title: 'Hanging<br>quotes' },
  { x: 94, y: 67, shortcut: 'drop', title: 'Drop caps' },
  { x: 768, y: 56, shortcut: 'emda', title: 'Em dash' },
  { x: 208, y: 254, shortcut: 'figu', title: 'Figure dash' },
  { x: 410, y: 120, shortcut: 'spac', title: 'Hair spaces' },
  { x: 941, y: 55, shortcut: 'hyph', title: 'Hyphenation' },
  { x: 169, y: 152, shortcut: 'liga', title: 'Ligatures' },
  { x: 282, y: 187, shortcut: 'disc', title: 'Discretionary ligatures' },
  { x: 153, y: 55, shortcut: 'altl', title: 'Alternate ligatures' },
  { x: 573, y: 290, shortcut: 'olds', title: 'Old-style numerals' },
  { x: 86, y: 520, shortcut: 'fleu', title: 'Fleurons' },
  { x: 666, y: 253, shortcut: 'supe', title: 'Superscript glyphs' },
  { x: 347, y: 388, shortcut: 'nume', title: 'Numero' },
  { x: 334, y: 452, shortcut: 'alte', title: 'Alternate glyphs' },
  { x: 281, y: 324, x2: 332, y2: 323, shortcut: 'brac', title: 'Brackets around numbers' },
  { x: 696, y: 155, shortcut: 'smal', title: 'Small caps' },
  { x: 889, y: 88, shortcut: 'mult', title: 'Multiplication sign' },
  { x: 557, y: 152, shortcut: 'elli', title: 'Ellipsis' },
]

var TYPOGRAPHY_DETAILS_TYPEWRITER = [
  { x: 201, y: 271, shortcut: '11', title: '' },
  { x: 291, y: 271, shortcut: '00', title: '' },
  { x: 193, y: 422, shortcut: '!!', title: '' },
  { x: 867, y: 325, shortcut: ';;', title: '' },
  { x: 605, y: 145, shortcut: '  ', title: '' },
  { x: 347, y: 473, shortcut: '--', title: '' },
]

var typographyDetailsDone = []
var typographyDetailsLastMatch = ''

var typographyDetailsKeyboardBuffer = '    '

/**
 * Return the proper array of typographical details depending on the slide.
 */
function getTypographyDetailsArray() {
  var currentSlideId = getCurrentSlideId()
  switch (currentSlideId) {
    case 'typography-details-good':
      var array = TYPOGRAPHY_DETAILS_GOOD
      break
    case 'typography-details-typewriter':
      var array = TYPOGRAPHY_DETAILS_TYPEWRITER
      break
  }

  return array
}

/**
 * Hide the loupe by moving it off-slide.
 */
function hideTypographyDetailsLoupe() {
  typographyDetailsUpdateLast()
  typographyDetailsMoveLoupe(1024 / 2, 768)
  typographyDetailsChangeTitle('')  
}

/**
 * Process the key press.
 */
function onTypographyDetailsKeyDown(event) {
  var array = getTypographyDetailsArray()

  if (!array) {
    return
  }

  if (event.keyCode == 27) { // Esc
    hideTypographyDetailsLoupe()
  } else if (event.keyCode == 32) { // space
    // Next in line

    var match = null
    array.map(function(el) {
      if (!match && (typographyDetailsLastMatch.shortcut != el.shortcut) && (typographyDetailsDone.indexOf(el.shortcut) == -1)) {
        match = el
      }
    })

    if (match) {
      typographyDetailsKeyboardBuffer = match.shortcut
      processTypographyDetailsBuffer()
    } else {
      hideTypographyDetailsLoupe()
    }
  } else {
    // Typed in

    var newLetter = String.fromCharCode(event.keyCode)

    typographyDetailsKeyboardBuffer += newLetter
    typographyDetailsKeyboardBuffer = typographyDetailsKeyboardBuffer.toLowerCase()

    processTypographyDetailsBuffer()
  }
}

function typographyDetailsMoveLoupe(x, y) {
  var loupeEl = slideEls[currentSlideNumber].querySelector('.typography-details-loupe')

  loupeEl.querySelector('img').style.marginLeft = (-x * 2 + 75) + 'px'
  loupeEl.querySelector('img').style.marginTop = (-y * 2 - 720 * 2 + 75) + 'px'

  loupeEl.style.webkitTransform = 'translate(' + x + 'px, ' + y + 'px)'

  slideEls[currentSlideNumber].querySelector('.typography-details-loupe-caption').style.webkitTransform = 
      'translate(' + x + 'px, ' + y + 'px)'
  slideEls[currentSlideNumber].querySelector('.typography-details-loupe-caption-shadow').style.webkitTransform = 
      'translate(' + x + 'px, ' + y + 'px)'  
}

function typographyDetailsChangeTitle(title) {
  slideEls[currentSlideNumber].querySelector('.typography-details-loupe-caption').innerHTML = title
  slideEls[currentSlideNumber].querySelector('.typography-details-loupe-caption-shadow').innerHTML = title
}

function typographyDetailsUpdateLast() {
  if (typographyDetailsLastMatch) {
    if (typographyDetailsDone.indexOf(typographyDetailsLastMatch.shortcut) == -1) {
      var loupeTraceEl = document.createElement('div')
      loupeTraceEl.classList.add('typography-details-loupe-trace')
      loupeTraceEl.style.webkitTransform = 
          'translate(' + typographyDetailsLastMatch.x + 'px, ' + typographyDetailsLastMatch.y + 'px)'

      slideEls[currentSlideNumber].appendChild(loupeTraceEl)

      typographyDetailsDone.push(typographyDetailsLastMatch.shortcut)
    }
  }
}

function processTypographyDetailsBuffer() {  
  var array = getTypographyDetailsArray()

  var match = null
  array.map(function(el) {
    if (el.shortcut == typographyDetailsKeyboardBuffer.substr(typographyDetailsKeyboardBuffer.length - el.shortcut.length, el.shortcut.length)) {
      match = el
    }
  })

  if (match) {
    typographyDetailsUpdateLast()

    typographyDetailsMoveLoupe(match.x, match.y)
    typographyDetailsChangeTitle(match.title)

    typographyDetailsLastMatch = match
  }
}

/**
 * Prepare a later slide where all the instances of the loupe are highlighted.
 */
function prepareFillLoupe() {
  var slideEl = document.querySelector('[data-slide-id="typography-details-good-filled"]')

  for (var i in TYPOGRAPHY_DETAILS_GOOD) {
    var loupeTraceEl = document.createElement('div')
    loupeTraceEl.classList.add('typography-details-loupe-trace')
    loupeTraceEl.style.webkitTransform = 
        'translate(' + TYPOGRAPHY_DETAILS_GOOD[i].x + 'px, ' + TYPOGRAPHY_DETAILS_GOOD[i].y + 'px)'

    slideEl.appendChild(loupeTraceEl)
  }
}

// Specific slide logic: Underline playground
// --------------------------------------------------------------------------

function underlinePlaygroundPlaceInContext() {
  var el = slideEls[currentSlideNumber]

  if (!el.querySelector('.underline-playground-buttons').classList.contains('hidden')) {
    el.querySelector('.underline-playground-buttons').classList.add('hidden')

    el.querySelector('.text-small').classList.add('hidden')

    el.querySelector('.underline-playground-master').classList.add('zoom-out')

    el.querySelector('.underline-playground-over').classList.add('zoom-out')

    underlinePlaygroundClearing({ target: document.querySelector('#upo-c') }, true)

    el.querySelector('.underline-long-text').classList.add('visible')
    //console.log(el.querySelector('.underline-long-text'))

    el.classList.remove('dark')

    window.setTimeout(function() {
      el.classList.remove('uncropped')
    }, 500)

    var el2 = slideEls[currentSlideNumber].querySelector('.underline-playground-master')
    el2.classList.remove('reveal-text')
    el2.classList.remove('reveal-gradient')
  } else {
    el.querySelector('.underline-playground-buttons').classList.remove('hidden')
  }
}

function underlinePlaygroundRevealGradient() {
  var el = slideEls[currentSlideNumber].querySelector('.underline-playground-master')
  el.classList.remove('reveal-text')

  if (el.classList.contains('reveal-gradient')) {
    el.classList.add('transitioned')
    el.classList.remove('reveal-gradient')
    window.setTimeout(function() {
      el.classList.remove('transitioned')
    }, 2000)
  } else {
    el.classList.add('reveal-gradient')
  }
}

function underlinePlaygroundRevealText() {
  var el = slideEls[currentSlideNumber].querySelector('.underline-playground-master')
  el.classList.remove('reveal-gradient')

  if (el.classList.contains('reveal-text')) {
    el.classList.add('transitioned')
    el.classList.remove('reveal-text')
    window.setTimeout(function() {
      el.classList.remove('transitioned')
    }, 2000)
  } else {
    el.classList.add('reveal-text')
  }
}

function propagateSlider(event) {
  document.querySelectorAll('.' + event.target.className).forEach(function(el) { el.value = event.target.value })

  document.querySelectorAll('.label-' + event.target.className).forEach(function(el) { el.classList.add('visible') })
}

function underlinePlaygroundText(event) {
  document.querySelectorAll('.underline-playground-master .text').forEach(function(el) { 
    if (el != event.target) {
      el.innerHTML = event.target.innerHTML
    } 
  })
}

function underlinePlaygroundPosition(event) {
  propagateSlider(event)

  document.querySelectorAll('.underline-playground-master .underline').forEach(function(el) {
    el.style.backgroundPositionY = event.target.value + 'px'
  })

  document.querySelectorAll('.underline-playground-master .underline-small').forEach(function(el) {
    el.style.backgroundPositionY = (event.target.value / 7.27) + 'px'
  })
}

function underlinePlaygroundSize(event) {
  propagateSlider(event)

  document.querySelectorAll('.underline-playground-master .underline').forEach(function(el) {
    el.style.backgroundSize = '100% ' + (event.target.value * 2 / 10) + 'px'
  })

  document.querySelectorAll('.underline-playground-master .underline-small').forEach(function(el) {
    el.style.backgroundSize = '100% ' + ((event.target.value * 2 / 10) / 7.27) + 'px'
  })
}

function underlinePlaygroundOpacity(event) {
  propagateSlider(event)

  document.querySelectorAll('.underline-playground-master .underline').forEach(function(el) {
    el.style.opacity = event.target.value / 100
  })
  document.querySelectorAll('.underline-playground-master .underline-small').forEach(function(el) {
    el.style.opacity = event.target.value / 100
  })
}

function underlinePlaygroundClearing(event, dark) {
  propagateSlider(event)

  var value = event.target.value / 10

  document.querySelectorAll('.underline-playground-master .text').forEach(function(el) {
    if (value == 0) {
      el.style.textShadow = 'none'  
    } else {
      if (dark) {
        var color = 'white'
      } else {
        var color = 'rgb(160, 20, 40)'
      }

      el.style.textShadow =
          '0 -' + (value * 5 / 8) + 'px 0 ' + color + ',' +
          '-' + (value * .5 / 8) + 'px 0 0 ' + color + ',' +
          (value * .5 / 8) + 'px 0 0 ' + color + ',' +
          '-' + (value * 1 / 8) + 'px 0 0 ' + color + ',' +
          (value * 1 / 8) + 'px 0 0 ' + color + ',' +
          '-' + (value * 3 / 8) + 'px 0 0 ' + color + ',' +
          (value * 3 / 8) + 'px 0 0 ' + color + ',' +
          '-' + (value * 6 / 8) + 'px 0 0 ' + color + ',' +
          (value * 6 / 8) + 'px 0 0 ' + color + ',' +
          '-' + (value) + 'px 0 0 ' + color + ',' +
          (value) + 'px 0 0 ' + color
    }
  })

  var value = event.target.value / 10 / 7.27

  document.querySelectorAll('.underline-playground-master .text-small').forEach(function(el) {
    if (value == 0) {
      el.style.textShadow = 'none'  
    } else {
      el.style.textShadow =
          '0 -' + (value * 5 / 8) + 'px 0 white,' +
          '-' + (value * .5 / 8) + 'px 0 0 white,' +
          (value * .5 / 8) + 'px 0 0 white,' +
          '-' + (value * 1 / 8) + 'px 0 0 white,' +
          (value * 1 / 8) + 'px 0 0 white,' +
          '-' + (value * 3 / 8) + 'px 0 0 white,' +
          (value * 3 / 8) + 'px 0 0 white,' +
          '-' + (value * 6 / 8) + 'px 0 0 white,' +
          (value * 6 / 8) + 'px 0 0 white,' +
          '-' + (value) + 'px 0 0 white,' +
          (value) + 'px 0 0 white'
    }
  })
}


// General slide logic
// --------------------------------------------------------------------------

// Whether to skip less important slides or not (https://medium.com/p/63afe6c72e09)
var skipLessImportantSlides = false

// Current displayed slide number
var currentSlideNumber
// All the slide elements
var slideEls

/**
 * Show the current slide (and hide all the other slides).
 */
function showSlide() {
  var els = document.querySelectorAll('.presentation > div.visible')
  els.forEach(function(el) {
    el.classList.remove('visible')
  })

  slideEls[currentSlideNumber].classList.add('visible')

  updateUrlFragment()

  typographyDetailsLastMatch = ''
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
    slideEl.classList.remove('loaded')
  }
}

/**
 * Load iframe on a given slide, if any
 */
function loadIframes(slideEl) {
  if (slideEl.querySelector('iframe') && !slideEl.querySelector('iframe').classList.contains('loaded')) {
    slideEl.querySelector('iframe').src = slideEl.querySelector('iframe').getAttribute('orig-src')
    slideEl.querySelector('iframe').classList.add('loaded')
  }
}

/**
 * Prepare the slide just ahead of the next slide.
 */
function onSlidePreEntry(slideEl) {
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
function onSlideEntry(slideEl, instant) {
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

  // Play animations if any
  var els = slideEl.querySelectorAll('.animate-on-entry:not(.animate)')
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
    onSlideEntry(slideEls[currentSlideNumber], instant)

    // Preload the next slide for smoother transition
    var nextSlideEl = slideEls[currentSlideNumber + 1]
    if (nextSlideEl) {
      onSlidePreEntry(nextSlideEl)
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
    onSlideEntry(slideEls[currentSlideNumber], instant)
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

    case 67: // C
      if ((document.activeElement == document.body) || (document.activeElement.getAttribute('type') == 'range')) {
        if (slideEls[currentSlideNumber].querySelector('.underline-playground-master')) {
          underlinePlaygroundPlaceInContext()
        }
      }
      break    

    case 71: // G
      if ((document.activeElement == document.body) || (document.activeElement.getAttribute('type') == 'range')) {
        if (slideEls[currentSlideNumber].querySelector('.underline-playground-master')) {
          underlinePlaygroundRevealGradient()
        }
      }
      break

    case 84: // T
      if ((document.activeElement == document.body) || (document.activeElement.getAttribute('type') == 'range')) {
        if (slideEls[currentSlideNumber].querySelector('.underline-playground-master')) {
          underlinePlaygroundRevealText()
        }
      }
      break
  }

  var currentSlideId = getCurrentSlideId()
  switch (currentSlideId) {
    case 'typography-details-good':
    case 'typography-details-typewriter':
      onTypographyDetailsKeyDown(event)
      break
  }
}

/**
 * Modify the punctuation on the slides so that it looks better.
 */
function setUpBetterPunctuation() {
  var els = document.querySelectorAll('h1, h2, h3, div')

  els.forEach(function(el) {
    var html = el.innerHTML

    if ((!el.querySelectorAll('*:not(br)').length) && 
        (!el.classList.contains('no-smart-typography'))) {
      var html = el.innerHTML

      html = html.replace(/,/g, '<span class="comma">\'</span>')
      html = html.replace(/\./g, '<span class="full-stop">.</span>')
      html = html.replace(/…/g, '<span class="ellipsis">...</span>')
      html = html.replace(/’/g, '\'')

      el.innerHTML = html
    }
  })
}

/**
 * Hyphenate the text on some slides for aesthetic reasons.
 */
function hyphenateSlides() {
  var els = document.querySelectorAll('.quote > .content')
  els.forEach(function(el) {
    el.classList.add('hyphenate')
  })

  Hyphenator.config({
    displaytogglebox: false,
    minwordlength: 4
  })
  Hyphenator.run()
}

/**
 * Main presentation entry (requested as DOM loads).
 */
function main() {
  slideEls = document.querySelectorAll('.presentation > div')

  // Set up
  getSlideNumberFromUrlFragment()
  showSlide(true, true)
  onSlideEntry(slideEls[currentSlideNumber], false)

  // Specific slide preparations
  prepareFillLoupe()
  underlinePlaygroundPosition({ target: document.querySelector('#upo-p') })
  underlinePlaygroundSize({ target: document.querySelector('#upo-s') })
  underlinePlaygroundClearing({ target: document.querySelector('#upo-c') })
  underlinePlaygroundOpacity({ target: document.querySelector('#upo-o') })
  document.querySelectorAll('label').forEach(function(el) { el.classList.remove('visible') })

  // Slide manipulation
  hyphenateSlides()
  setUpBetterPunctuation()

  document.body.addEventListener('keydown', onKeyDown)
  document.body.focus()
}
