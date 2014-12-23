'use strict';

// Live (production) server where the presentation sends the max slide info
var SERVER_URL_UPDATE = '' // FILL ME OUT, PLEASE (if you are hosting on Nodejitsu, this will look like https://XXX.jit.su/update)
// Local (testing) server
var SERVER_URL_UPDATE_LOCAL = 'http://localhost:8080/update'

// How many first slides should have the companion site visible. We can also cherry-pick individual
// slides later by adding force-show-companion-url as a class to the slide
var SHOW_COMPANION_URL_MAX_NUMBER = 16
// As you run the presentation, it communicates to the server (and, eventually, all the people
// in the audience that have companion sites open) which slide is the last (maximum) slide visible.
// This will only grow over time, since the presenter going back in time should not prevent people
// from seeing/tweeting the later slides once they were once visible.
//
// However, that means the maximum slide number needs to be reset every time the talk starts
// again. Since it’d be annoying for the presenter to have to remember to do that, we just 
// automatically reset it during any of the first three slides – with the assumption that the
// presenter will never go back to those first three slides during the course of normal presentation.
var MAX_SLIDE_RESET = 3

// Current slide number
var currentSlideNumber = 0
// Maximum slide number seen so far. Used to communicate with the companion site.
var maxSlideNumber = 0
// Whether to skip less important slides or not (https://medium.com/p/63afe6c72e09)
var skipLessImportantSlides = false
// All the slide elements
var slideEls

// Use (and advertise on the screen) the companion site. Enabled by adding ?companion to the URL
var useCompanion = false
// Use local server for communicating with the companion site. Used for debugging. Enabled
// by adding ?local to the URL 
var useLocalServer = false


// My stupid letter animation trickery
// --------------------------------------------------------------------------
var ANIMATE_LETTERS_STROKES = {
  'a': [ { x1: 25, y1: 335, x2: 135, y2: 90 }, { x1: 135, y1: 90, x2: 236, y2: 334 }, { x1: 60, x2: 208, y: 262 } ],
  'b': [ { x: 52, y1: 70, y2: 340 }, { x: 102, y: 145, rR: 58 }, { x: 112, y: 255, rR: 58 } ],
  'c': [ { x: 150, y: 195, rRev: 116 } ],
  'd': [ { x: 52, y1: 70, y2: 340 }, { x: 88, y: 200, rR: 108 } ],
  'e': [ { x: 52, y1: 70, y2: 340 }, { x1: 31, x2: 194, y: 91 }, { x1: 31, x2: 194, y: 197 }, { x1: 31, x2: 194, y: 313 } ],
  'f': [ { x: 52, y1: 70, y2: 340 }, { x1: 31, x2: 194, y: 91 }, { x1: 31, x2: 194, y: 197 } ],
  'g': [ { x: 150, y: 195, rRev: 116 }, { x1: 176, x2: 246, y: 218 }, { x: 217, y1: 200, y2: 300 } ],
  'h': [ { x: 52, y1: 70, y2: 340 }, { x1: 50, x2: 210, y: 199 }, { x: 211, y1: 70, y2: 340 } ],
  'i': [ { x: 52, y1: 70, y2: 340 } ],
  'j': [ { x: 129, y1: 70, y2: 340 }, { x: 72, y: 254, r: 60 } ],
  'k': [ { x: 52, y1: 70, y2: 340 }, { x1: 52, y1: 196, x2: 189, y2: 79 }, { x1: 52, y1: 186, x2: 189, y2: 324 } ],
  'l': [ { x: 52, y1: 70, y2: 340 }, { x1: 31, y: 310, x2: 194 } ],
  'm': [ { x1: 26, y1: 331, x2: 99, y2: 87 }, { x1: 77, y1: 92, x2: 180, y2: 315 }, { x1: 156, y1: 312, x2: 258, y2: 98 }, { x1: 237, y1: 93, x2: 306, y2: 333 } ],
  'n': [ { x: 52, y1: 334, y2: 70 }, { x1: 30, y1: 103, x2: 248, y2: 302 }, { x: 223, y1: 70, y2: 334 } ],
  'o': [ { x: 150, y: 195, r: 116 } ],
  'p': [ { x: 52, y1: 70, y2: 340 }, { x: 98, y: 170, rR: 78 } ],
  'q': [ { x: 150, y: 195, r: 116 }, { x1: 241, y1: 292, x2: 280, y2: 337 } ],
  'r': [ { x: 52, y1: 70, y2: 340 }, { x: 98, y: 170, rR: 78 }, { x1: 127, y1: 254, x2: 194, y2: 326 } ],
  's': [ { x: 103, y: 138, rRev: 50 }, { x: 103, y: 256, rShifted: 60 } ],
  't': [ { x1: 4, x2: 213, y: 90 }, { x: 106, y1: 72, y2: 334 } ],
  'u': [ { x: 49, y1: 70, y2: 258 }, { x: 130, y: 240, rRevShifted: 80 }, { x: 208, y1: 258, y2: 70 } ],
  'v': [ { x1: 31, y1: 70, x2: 148, y2: 315 }, { x1: 120, y1: 305, x2: 240, y2: 72 }],
  'w': [ { x1: 26, y1: 72, x2: 99, y2: 309 }, { x1: 77, y1: 303, x2: 180, y2: 91 }, { x1: 156, y1: 91, x2: 258, y2: 303 }, { x1: 237, y1: 309, x2: 306, y2: 72 } ],
  'x': [ { x1: 36, y1: 72, x2: 236, y2: 331 }, { x1: 36, y1: 331, x2: 236, y2: 72 }],
  'y': [ { x1: 26, y1: 69, x2: 127, y2: 252 }, { x1: 228, y1: 69, x2: 127, y2: 252 }, { x: 128, y1: 247, y2: 334 } ],
  'z': [ { x1: 17, x2: 210, y: 90 }, { x1: 210, x2: 17, y: 314 }, { x1: 180, y1: 90, x2: 47, y2: 314 } ],
}

var letterAnimationsInProgress = []

var letterAnimationsInProgressCount = 0
var nextLetterAnimationScheduled = false

// All the numbers in ANIMATE_LETTERS_STROKES are measured with font-size: 400px (= offsetHeight 360). 
// For fonts of other size, they will have to be normalized
var ANIMATE_LETTER_ORIGINAL_HEIGHT = 360 
var STROKE_RADIUS = 30
// How many last letters of a given span with .animate-letters should be used
var ANIMATE_LETTER_SUFFIX_COUNT = 5
var STROKE_DELAY_DIFFERENCE = .3
var LETTER_DELAY_DIFFERENCE = .3
var LETTER_DRAWING_TIME_INCREMENT = .01
var LETTER_ANIMATION_SPEED = .08


/**
 * Prepare the weird canvas covers to fake animate letters.
 */
function prepareAnimateLetters() {
  var els = slideEls[currentSlideNumber].querySelectorAll('.letter-animate')
  var globalCount = 0
  var zIndex = 0

  els.forEach(function(el) {
    if (el.classList.contains('letter-animate-done')) {
      return;
    }

    el.classList.add('letter-animate-done')

    // Figure out scale and width and height (with some generous padding)
    var scale = el.offsetHeight / ANIMATE_LETTER_ORIGINAL_HEIGHT
    var width = parseInt(el.offsetWidth + .1 * el.offsetHeight)
    var height = parseInt(el.offsetHeight * 1.4)

    var newEl = document.createElement('canvas')
    newEl.classList.add('letter-animate-cover')
    newEl.width = width
    newEl.height = height
    newEl.style.width = width + 'px'
    newEl.style.height = height + 'px'
    newEl.style.left = el.offsetLeft + 'px'
    newEl.style.top = el.offsetTop + 'px'

    el.style.zIndex = 999999 + zIndex * 2
    newEl.style.zIndex = 999999 + zIndex * 2 + 1
    zIndex++

    el.parentNode.appendChild(newEl)
    el.classList.add('animation-in-progress')

    // Hackily figure out the background colour
    if (slideEls[currentSlideNumber].classList.contains('dark') ||
        slideEls[currentSlideNumber].classList.contains('title') ||
        slideEls[currentSlideNumber].classList.contains('heading')) {
      newEl.getContext('2d').fillStyle = 'rgb(160, 20, 40)'
    } else {
      newEl.getContext('2d').fillStyle = 'white'
    }
    // Fill the rectangle with a given background colour
    newEl.getContext('2d').beginPath()
    newEl.getContext('2d').rect(0, 0, width, height)
    newEl.getContext('2d').fill()

    var letter = el.innerText.toLowerCase()
    var currentTimes = []
    var count = 0
    if (ANIMATE_LETTERS_STROKES[letter]) {
      ANIMATE_LETTERS_STROKES[letter].forEach(function (anim) {
        currentTimes.push(.8 + -STROKE_DELAY_DIFFERENCE * count - STROKE_DELAY_DIFFERENCE * globalCount)
        count++
      })
    } else {
      currentTimes.push(.8 + -STROKE_DELAY_DIFFERENCE * globalCount)
    }

    var anim = {
      letter: el.innerText.toLowerCase(),
      done: false,
      scale: scale,
      currentTimes: currentTimes,
      el: newEl
    }
    globalCount += count

    letterAnimationsInProgressCount++
    letterAnimationsInProgress.push(anim)

    // Pre-draw from 0 to initial state
    for (var i in anim.currentTimes) {
      var endTime = anim.currentTimes[i]
      for (var time = 0; time < endTime; time += LETTER_DRAWING_TIME_INCREMENT) {
        anim.currentTimes[i] = time
        paintAnimLetterFrame(anim, i)
      }      
    }
  })

  scheduleNextAnimateLettersTick()
}


/**
 * Schedule next frame of letter animation.
 */
function scheduleNextAnimateLettersTick() {
  if (letterAnimationsInProgressCount > 0 && !nextLetterAnimationScheduled) {
    nextLetterAnimationScheduled = true
    window.requestAnimationFrame(animateLettersTick)
  }  
}


/**
 * Erase a circle-shaped part from a given context. Analogous to clearRect.
 */
function clearCircle(ctx, x, y, r) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 2 * Math.PI, false)
  ctx.clip()
  ctx.clearRect(x - r - 1, y - r - 1, r * 2 + 2, r * 2 + 2)
  ctx.restore()
}

function paintAnimLetterFrame(anim, i) {
  var done 
  var stroke = ANIMATE_LETTERS_STROKES[anim.letter] && ANIMATE_LETTERS_STROKES[anim.letter][i]
  var radius = STROKE_RADIUS
  var time = anim.currentTimes[i]

  if (time < 0) {
    // Don’t do anything before we start
    done = false
    return done
  } else if (time > 1) {
    time = 1
    done = true
  } else {
    done = false        
  }

  var ctx = anim.el.getContext('2d')
  var scale = anim.scale

  if (!stroke) { // Unknown glyph – simple down swipe over the entire box
    ctx.clearRect(0, 0, anim.el.width, anim.el.height * time)
  } else if (stroke.rR) { // Right half semicircle
    clearCircle(ctx, scale * (stroke.x + Math.sin(time * (Math.PI * 1.2) - Math.PI * .1) * stroke.rR),
                       scale * (stroke.y - Math.cos(time * (Math.PI * 1.2) - Math.PI * .1) * stroke.rR),
                       scale * radius)
  } else if (stroke.r) { // Full radial
    clearCircle(ctx, scale * (stroke.x + Math.cos(time * Math.PI * 2) * stroke.r),
                       scale * (stroke.y + Math.sin(time * Math.PI * 2) * stroke.r),
                       scale * radius)
  } else if (stroke.rShifted) { // Full radial (shifted)
    clearCircle(ctx, scale * (stroke.x + Math.cos(time * Math.PI * 2 - 1.4) * stroke.rShifted),
                       scale * (stroke.y + Math.sin(time * Math.PI * 2 - 1.4) * stroke.rShifted),
                       scale * radius)
  } else if (stroke.rRev) { // Full radial reverse
    clearCircle(ctx, scale * (stroke.x + Math.cos(time * Math.PI * 2 + .2) * stroke.rRev),
                       scale * (stroke.y + Math.sin(-time * Math.PI * 2 - .2) * stroke.rRev),
                       scale * radius)
  } else if (stroke.rRevShifted) { // Full radial reverse (shifted)
    clearCircle(ctx, scale * (stroke.x + Math.cos(time * Math.PI * 2 + 1.6) * stroke.rRevShifted),
                       scale * (stroke.y + Math.sin(-time * Math.PI * 2 - 1.6) * stroke.rRevShifted),
                       scale * radius)
  } else if (stroke.x && stroke.y1 && stroke.y2) { // Vertical stroke
    ctx.clearRect(scale * (stroke.x - radius), scale * stroke.y1, scale * radius * 2, scale * (stroke.y2 - stroke.y1) * time)
  } else if (stroke.x1 && stroke.x2 && stroke.y) { // Horizontal stroke
    ctx.clearRect(scale * stroke.x1, scale * (stroke.y - radius), scale * (stroke.x2 - stroke.x1) * time, scale * radius * 2)
  } else { // Diagonal
    ctx.clearRect(scale * (stroke.x1 + (stroke.x2 - stroke.x1) * time - radius), 
                        scale * (stroke.y1 + (stroke.y2 - stroke.y1) * time - radius), 
                        scale * radius * 2, scale * radius * 2)
  }

  return done
}


/** 
 * Next step in letter animation.
 */
function animateLettersTick() {
  nextLetterAnimationScheduled = false

  letterAnimationsInProgress.forEach(function(anim) {
    if (anim.done) {
      return
    }

    var everythingDone = true

    for (var i in anim.currentTimes) {
      var oldTime = anim.currentTimes[i]
      var newTime = anim.currentTimes[i] + LETTER_ANIMATION_SPEED

      for (var time = oldTime; time < newTime; time += LETTER_DRAWING_TIME_INCREMENT) {
        anim.currentTimes[i] = time
        paintAnimLetterFrame(anim, i)  
      }

      // Last frame
      anim.currentTimes[i] = newTime
      if (!paintAnimLetterFrame(anim, i)) {
        everythingDone = false
      }
    }

    if (everythingDone) {
      anim.done = true
      anim.el.parentNode.removeChild(anim.el)
      letterAnimationsInProgressCount--
    }
  })

  scheduleNextAnimateLettersTick()
}



// General slide logic
// --------------------------------------------------------------------------

/**
 * Show a current slide and do all the things necessary around it.
 */
function showSlide() {
  // Hide other slides and show the current slide
  var els = document.querySelectorAll('.presentation > div.visible')
  els.forEach(function(el) {
    el.classList.remove('visible')
  })
  slideEls[currentSlideNumber].classList.add('visible')

  // Update the # number locally, and send the slide number to the server
  updateUrlFragment()
  sendSlideNumberToServer(false)

  // Show the URL of the companion site
  if (useCompanion && ((currentSlideNumber < SHOW_COMPANION_URL_MAX_NUMBER) || 
      (slideEls[currentSlideNumber].classList.contains('force-show-companion-url')))) {
    document.querySelector('.companion-url').classList.add('visible')
  } else {
    document.querySelector('.companion-url').classList.remove('visible')    
  }
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

  // Doing it again, even though we did it in onSlidePreEnter, so that the presenter
  // can safely refresh
  loadIframes(slideEl)

  // Focus on things if so requested
  if (!instant && slideEl.classList.contains('focus-after-transition')) {
    slideEl.querySelector('iframe') && slideEl.querySelector('iframe').focus()
    slideEl.querySelector('input') && slideEl.querySelector('input').focus()
  }

  // Play custom slide animations, if any
  var els = slideEl.querySelectorAll('.animate-on-enter:not(.animate)')
  els.forEach(function(el) {
    window.setTimeout(function() {
      el.classList.add('animate')
    }, 0)
  })

  // Animate letters!
  if (!instant) {
    var els = slideEl.querySelectorAll('.animate-letters')
    els.forEach(function(el) {
      if (el.classList.contains('animate-letters-done')) {
        return;
      }

      el.classList.add('animate-letters-done')

      var text = $.trim(el.innerHTML)
      var html = text.substr(0, text.length - ANIMATE_LETTER_SUFFIX_COUNT)
      for (var i = 0; i < ANIMATE_LETTER_SUFFIX_COUNT; i++) {
        var letter = text.substr(text.length - ANIMATE_LETTER_SUFFIX_COUNT + i, 1)

        if (letter == ' ') { 
          html += letter
        } else {
          html += '<span class="letter-animate">' + letter + '</span>'
        }
      }
      el.innerHTML = html
    })
    window.setTimeout(prepareAnimateLetters, 0)
  }
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


/**
 * Get the appropriate server URL depending on whether we are live or not.
 */
function getServerUrl() {
  return useLocalServer ? SERVER_URL_UPDATE_LOCAL : SERVER_URL_UPDATE
}


/**
 * Send the slide number to the server.
 */
function sendSlideNumberToServer(force) {
  if (!useCompanion) {
    return
  }

  if (force || ((currentSlideNumber + 1 > maxSlideNumber) || (currentSlideNumber + 1 <= MAX_SLIDE_RESET))) {
    var oldMaxSlideNumber = maxSlideNumber
    maxSlideNumber = currentSlideNumber + 1

    var url = getServerUrl() + 
        '?newSlideMax=' + maxSlideNumber + 
        '&skipIfPressedOnTime=' + skipLessImportantSlides

    // Last slide (assumption: last slide is not skippable)
    if (currentSlideNumber == slideEls.length - 1) {
      url += '&presentationOver=true'
    }

    $.post(url)

    console.log('Server: Updated max slide to ' + maxSlideNumber + '…', url)
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


/** 
 * React to keys being pressed.
 */
function onKeyDown(event) {
  switch (event.keyCode) {
    case 189: // Minus
      if (document.activeElement == document.body) {
        skipLessImportantSlides = true
        flashIndicator()
        sendSlideNumberToServer(true)
        event.preventDefault()
      }
      break
    case 187: // Plus
      if (document.activeElement == document.body) {
        skipLessImportantSlides = false
        flashIndicator()
        sendSlideNumberToServer(true)
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

    case 68: // D
      if (event.shiftKey) {
        var SLIDE_INFO = []
        var els = document.querySelectorAll('.presentation > div')
        for (var i = 0, el; el = els[i]; i++) {
          var slideInfo = {}
          slideInfo.filename = (i + 1) + '.jpg'
          slideInfo.skipInCompanion = el.classList.contains('skip-in-companion')

          if (el.querySelector('.companion-copy')) {
            slideInfo.copy = el.querySelector('.companion-copy').innerText
          }

          if (el.classList.contains('skip-if-pressed-on-time')) {
            slideInfo.skipIfPressedOnTime = true
          }

          SLIDE_INFO.push(slideInfo)
        }

        document.querySelector('.debug').classList.add('visible')
        document.querySelector('.debug textarea').value = 'var SLIDE_INFO = ' + JSON.stringify(SLIDE_INFO, false, 2)
        document.querySelector('.debug textarea').select()
        document.querySelector('.debug textarea').focus()
        event.preventDefault()
      }
      break
  }
}


/**
 * Modify the punctuation on the slides so that it looks better.
 */
function setUpBetterPunctuation() {
  var els = document.querySelectorAll('h1, h2, h3, div, li, .punctuation')

  els.forEach(function(el) {
    if ((!el.classList.contains('companion-copy')) &&
        (!el.querySelectorAll('*:not(br):not(.animate-letters)').length) && 
        (!el.classList.contains('no-smart-typography'))) {
      var html = el.innerHTML

      html = html.replace(/,/g, '<span class="comma">\'</span>')
      if (!el.classList.contains('animate-letters')) {
        html = html.replace(/\./g, '<span class="full-stop">.</span>')
      }
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
  var els = document.querySelectorAll('.quote > .content, li')
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
 * Finish preparing the presentation once all the resources are loaded.
 */
function onBodyLoad() {
  document.querySelector('.presentation').classList.add('visible')

  // Set up
  getSlideNumberFromUrlFragment()
  showSlide(true, true)
  onSlideEnter(slideEls[currentSlideNumber], true)

  // Slide manipulation
  hyphenateSlides()
  setUpBetterPunctuation()

  document.body.addEventListener('keydown', onKeyDown)
  document.body.focus()
}


/**
 * Main presentation entry (requested as DOM loads).
 */
function main() {
  window.addEventListener('load', onBodyLoad)

  NodeList.prototype.forEach = HTMLCollection.prototype.forEach = Array.prototype.forEach

  useCompanion = (location.href.indexOf('?companion') != -1) ||
                   (location.href.indexOf('&companion') != -1)
  useLocalServer = (location.href.indexOf('?local') != -1) ||
                     (location.href.indexOf('&local') != -1)

  slideEls = document.querySelectorAll('.presentation > div')
}
