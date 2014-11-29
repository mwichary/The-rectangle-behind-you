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

function hideTypographyDetailsLoupe() {
  typographyDetailsUpdateLast()
  typographyDetailsMoveLoupe(1024 / 2, 768)
  typographyDetailsChangeTitle('')  
}

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


// General slide logic
// --------------------------------------------------------------------------

// Current displayed slide number
var currentSlideNumber
// All the slide elements
var slideEls

function showSlide() {
  var els = document.querySelectorAll('.presentation > div.visible')
  els.forEach(function(el) {
    el.classList.remove('visible')
  })

  slideEls[currentSlideNumber].classList.add('visible')

  updateUrlFragment()

  typographyDetailsLastMatch = ''
}

function nextSlide(instant) {
  if (currentSlideNumber < slideEls.length - 1) {
    currentSlideNumber++

    showSlide()

    var curSlideEl = slideEls[currentSlideNumber]
  }
}

function prevSlide(instant) {
  if (currentSlideNumber > 0) {
    currentSlideNumber--

    showSlide()
  }
}

/*
 * Update the page URL to include the slide number after a #
 */
function updateUrlFragment() {
  window.history.replaceState(null, '', '#' + (currentSlideNumber + 1))
}

/*
 * Retrieve current slide number from the URL fragment (if present).
 */
function getSlideNumberFromUrlFragment() {
  var fragment = window.location.hash || ''

  currentSlideNumber = (parseInt(fragment.substr(1)) - 1) || 0
}

/*
 * Get an optional ID identifying a special slide.
 */
function getCurrentSlideId() {
  return slideEls[currentSlideNumber].getAttribute('data-slide-id')
}

/*
 * React to a key being pressed.
 */
function onKeyDown(event) {
  switch (event.keyCode) {
    case 34: // remote next
    case 39: // right arrow
    case 40: // down arrow
      if (document.activeElement == document.body) {
        nextSlide(event.shiftKey)
        event.preventDefault()
      }
      break
    case 33: // remote previous
    case 37: // left arrow
    case 38: // up arrow
    case 8: // backspace
      if (document.activeElement == document.body) {
        prevSlide(event.shiftKey)
        event.preventDefault()
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

function main() {
  slideEls = document.querySelectorAll('.presentation > div')

  // Set up
  getSlideNumberFromUrlFragment()
  showSlide(true, true)

  document.body.addEventListener('keydown', onKeyDown)
  document.body.focus()
}
