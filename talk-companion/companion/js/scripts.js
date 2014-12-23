'use strict';

// What should be added to the end of every tweet – in this case, a hashtag
var TWEET_SUFFIX = '#smashingconf'

// The actual live server used for HTTP requests (GET)
var SERVER_URL = '' // FILL ME OUT, PLEASE (if you are hosting on Nodejitsu, this will look like https://XXX.jit.su)
// The local server used for debugging
var SERVER_URL_LOCAL = 'http://localhost:8080'

// The actual live server used for websockets
var SERVER_URL_WEBSOCKETS = '' // FILL ME OUT, PLEASE (if you are hosting on Nodejitsu, this will look like http://XXX.jit.su:80)
// The local server used for debugging
var SERVER_URL_WEBSOCKETS_LOCAL = 'http://localhost:8080'

// OAuth public key you’re using 
var OAUTH_PUBLIC_KEY = '' // FILL ME OUT, PLEASE (27 characters looking like this: jfFI2Jd8dHzZ…)

/**
 * This is the structure of the slides with extra metadata about each slide.
 * This is generated pseudo-automatically by pressing Shift+D in the talk.
 *
 * Note: These are all the slides, even those that should be skipped and never
 * will be used. It’s easier to generate and save those this way.
 * 
 * It could be generated better, from the command line.
 * It could also be in a separate file. :·)
 */
var SLIDE_INFO = [
  {
    "filename": "1.jpg",
    "skipInCompanion": false
  },
  {
    "filename": "2.jpg",
    "skipInCompanion": false,
    "copy": "Slide one"
  },
  {
    "filename": "3.jpg",
    "skipInCompanion": false,
    "copy": "Slide two"
  },
  {
    "filename": "4.jpg",
    "skipInCompanion": false,
    "copy": "Slide three"
  },
  {
    "filename": "5.jpg",
    "skipInCompanion": true
  },
  {
    "filename": "6.jpg",
    "skipInCompanion": false,
    "copy": "Slide four"
  },
  {
    "filename": "7.jpg",
    "skipInCompanion": false,
    "copy": "Slide five"
  },
  {
    "filename": "8.jpg",
    "skipInCompanion": false,
    "copy": "Slide six"
  },
  {
    "filename": "9.jpg",
    "skipInCompanion": false,
    "copy": "Slide seven",
    "skipIfPressedOnTime": true
  },
  {
    "filename": "10.jpg",
    "skipInCompanion": false,
    "copy": "Slide eight",
    "skipIfPressedOnTime": true
  },
  {
    "filename": "11.jpg",
    "skipInCompanion": false,
    "copy": "Last slide!"
  }
]


// ---------------------------------------------------------------------------

// Maximum tweet length with an image, used to truncate copy
var MAX_TWEET_LENGTH_WITH_IMAGE = 117

// When falling back to polling instead of websockets (“exponential” backoff), what are
// the timeouts to use, in seconds.
//
// The first 20 seconds is based on the assumptions websockets are working. If websockets
// didn’t change anything in 20 seconds, start polling manually – first aggressively, then
// less so. The last number is huge so that accessing the site later won’t 
var POLL_TIMEOUT_SEQUENCE = [20, 1, 1, 3, 5, 10, 30, 30, 60, 60, 999999999]

// ----------------------------------------

// Constants
var NO_MAX_SLIDE_NUMBER_AVAILABLE_YET = -1
var NO_SLIDE_AVAILABLE = -1

// ----------------------------------------

// Current slide number viewed by the user
var currentSlideNumber = 0
// Current slide number, rounded up or down to the actual slide that we can show
// (since some slides are marked to be skippable on the companion site)
var currentUnskippableSlideNumber = 0
// Maximum slide that the remote can see at a given moment
var maxSlideNumber = NO_MAX_SLIDE_NUMBER_AVAILABLE_YET
// Whether we are in the mode where we’re skipping slides because of time pressures
// (This is the mode the presenter can opt into.)
var skipIfPressedOnTime = false
// Slide currently being shared. Needs to be separate from currentSlideNumber since
// the slide can auto-advance while the sharing modal is open.
var slideToShareNumber

// Whether to use a local server for debugging. Is enabled by adding ?local 
// to a URL of the companion site.
var useLocalServer = false
// Whether we just show all the slides and don’t attempt any syncing. This could be
// used for debugging or presenter practice. Is enabled by adding ?override
// to a URL of the companion site.
var presenterOverride = false
// We are not interested in actually maintaining a sync with the presentation. This could
// happen either because of override just above, or because the presentation actually ended.
var stopSyncing = false

// Used for exponential GET backoff if websockets are failing or being slow
var pollTimeoutTablePos = 0
var pollTimeoutTimerId

// Whether the slide images have been loaded, and where we store them
var slideLoaded = []
var slideImages = []

// The oAuth object used to communicate with OAuth.Io
var oAuthObject


/**
 * Get the filename corresponding to a given slide.
 */
function getSlideImageFilename(number) {
  return 'images/slides/' + SLIDE_INFO[number].filename
}


/**
 * Remember that a given slide image have been loaded (and, presumably, cached) 
 * so that we don’t load it again.
 */
function onSlideImageLoaded(number) {
  slideLoaded[number] = true
}


/**
 * Load a given slide image, and then call the optional callback function.
 */
function loadSlide(number, callback) {
  // Don’t try to load slides that don’t exist.
  if ((number == NO_MAX_SLIDE_NUMBER_AVAILABLE_YET) || 
      (number < 0) || (number >= SLIDE_INFO.length)) {
    return
  }

  // If the image has already been loaded, jump straight to a callback.
  if (slideLoaded[number]) {
    callback && callback(number)
  } else {
    slideImages[number] = new Image()
    slideImages[number].addEventListener('load', function() { onSlideImageLoaded(number) })
    if (callback) {
      slideImages[number].addEventListener('load', function() { callback(number) })
    }
    slideImages[number].src = getSlideImageFilename(number)
  }
}


/**
 * Get the next slide after a given slide, skipping all the slides that should be skipped (either
 * they were designated to be skipped before the presentation started (skipInCompanion) or
 * on the fly by the presented (skipIfPressedOnTime).
 * 
 * If no next slide is available, return NO_SLIDE_AVAILABLE
 */
function getNextSlideNumberExcludingSkipped(slideNumber) {
  var nextSlideNumber = slideNumber
  do {
    nextSlideNumber++
  } while (nextSlideNumber < SLIDE_INFO.length && 
    (SLIDE_INFO[nextSlideNumber].skipInCompanion || 
    (SLIDE_INFO[nextSlideNumber].skipIfPressedOnTime && skipIfPressedOnTime)))

  if (nextSlideNumber >= SLIDE_INFO.length) {
    return NO_SLIDE_AVAILABLE
  } else {
    return nextSlideNumber
  }
}


/**
 * Get the previous slide after a given slide, skipping all the slides that should be skipped (either
 * they were designated to be skipped before the presentation started (skipInCompanion) or
 * on the fly by the presented (skipIfPressedOnTime).
 * 
 * If no previous slide is available, return NO_SLIDE_AVAILABLE
 */
function getPrevSlideNumberExcludingSkipped(slideNumber) {
  var prevSlideNumber = slideNumber
  do {
    prevSlideNumber--
  } while (prevSlideNumber >= 0 && 
    (SLIDE_INFO[prevSlideNumber].skipInCompanion || 
    (SLIDE_INFO[prevSlideNumber].skipIfPressedOnTime && skipIfPressedOnTime)))

  if (prevSlideNumber < 0) {
    return NO_SLIDE_AVAILABLE
  } else {
    return prevSlideNumber
  }
}


/** 
 * Get the “logical” slide number from the “physical” slide number. The logical slide number
 * is the one that counts just the slides that are not skipped.
 */
function getLogicalSlideNumber(slideNumber) {
  var logicalNumber = 0
  for (var i = 0; i <= slideNumber; i++) {
    if (!(SLIDE_INFO[i].skipInCompanion || (SLIDE_INFO[i].skipIfPressedOnTime && skipIfPressedOnTime))) {
      logicalNumber++
    }
  }

  return logicalNumber
}


/** 
 * Show the current slide on the screen and update the UI around it.
 */
function showCurrentSlide() {
  currentUnskippableSlideNumber = currentSlideNumber

  if (SLIDE_INFO[currentUnskippableSlideNumber].skipInCompanion || 
     (SLIDE_INFO[currentUnskippableSlideNumber].skipIfPressedOnTime && skipIfPressedOnTime)) {
    currentUnskippableSlideNumber = getPrevSlideNumberExcludingSkipped(currentSlideNumber)
  }

  // We have two navigations (although only one is visible), so we need to update both.
  // There is a better way to do this, probably just actually removing one or the other from DOM
  // on start.
  document.querySelectorAll('nav').forEach(function(el) {
    // Update the slide counter
    var slideNo = getLogicalSlideNumber(currentUnskippableSlideNumber)
    var maxSlideNo = getLogicalSlideNumber(maxSlideNumber - 1)

    var text = slideNo
    // Only show the total slide count if you’re behind
    if (maxSlideNo > slideNo) {
      text += '<span class="slash">/</span>' + maxSlideNo
    }
    el.querySelector('.slide-number-value').innerHTML = text

    // Update the download to desktop link
    if (el.querySelector('.save-to-desktop-link')) {
      el.querySelector('.save-to-desktop-link').setAttribute('download', 
          'good-great-slide-' + slideNo)
      el.querySelector('.save-to-desktop-link').setAttribute('href', 
          getSlideImageFilename(currentUnskippableSlideNumber))
    }
  })

  // Load the image and remember to show it after it’s loaded
  loadSlide(currentUnskippableSlideNumber, showSlideImage)

  // Preload the slides after and before so that they’re ready for when you jump to them.
  loadSlide(getNextSlideNumberExcludingSkipped(currentUnskippableSlideNumber))
  loadSlide(getPrevSlideNumberExcludingSkipped(currentUnskippableSlideNumber))

  // If not showing the max slide, highlight the CURRENT button.
  document.querySelectorAll('nav').forEach(function(el) {
    if (stopSyncing) {
      el.querySelector('button.current').classList.add('presentation-over')
    } else if (maxSlideNumber == NO_MAX_SLIDE_NUMBER_AVAILABLE_YET ||
       (getLogicalSlideNumber(currentUnskippableSlideNumber) == getLogicalSlideNumber(maxSlideNumber - 1))) {
      el.querySelector('button.current').classList.remove('playing-catch-up')
    } else {
      el.querySelector('button.current').classList.add('playing-catch-up')
    }
  })
}


/**
 * Hide the current slide. (Due to the nature of the site, also shows the “Loading…” message)
 */
function hideSlideImage() {
  document.querySelector('.current-slide').classList.remove('visible')
}


/**
 * Show the slide image and hide the loading indicator.
 */
function showSlideImage(number) {
  // We only show the just-loaded image if it’s actually the one on the screen (sicne the user
  // can move around after initiating a load).
  if (currentUnskippableSlideNumber == number) {
    document.querySelector('.current-slide img').src = slideImages[number].src

    // In a timeout because on some mobile phones, changing the src of the image takes
    // a while, and the old image would blink. This needs to be solved by just having two
    // images (double buffering).
    window.setTimeout(function() {
      document.querySelector('.current-slide').classList.add('visible')
    }, 0)
  }
}


/**
 * Go to the max slide (max == max allowed, the one the presenter is showing).
 */
function goMaxSlide() {
  event.preventDefault()
  if (maxSlideNumber == NO_MAX_SLIDE_NUMBER_AVAILABLE_YET) {
    return
  }

  if (currentUnskippableSlideNumber != maxSlideNumber - 1) {
    currentSlideNumber = maxSlideNumber - 1
    hideSlideImage()
    showCurrentSlide()
  }
}


/**
 * Go to the next slide. 
 */
function goNextSlide() {
  event.preventDefault()

  // Make sure to not go to a slide you’re supposed to skip.
  var nextSlideNumber = getNextSlideNumberExcludingSkipped(currentUnskippableSlideNumber)
  if (nextSlideNumber == NO_SLIDE_AVAILABLE) {
    return
  }

  currentSlideNumber = nextSlideNumber
  if (currentSlideNumber > maxSlideNumber - 1) {
    currentSlideNumber = maxSlideNumber - 1
  } else {
    hideSlideImage()
    showCurrentSlide()
  }
}


/**
 * Go the the previous slide.
 */
function goPrevSlide() {
  event.preventDefault()

  // Make sure to not go to a slide you’re supposed to skip.
  var prevSlideNumber = getPrevSlideNumberExcludingSkipped(currentUnskippableSlideNumber)
  if (prevSlideNumber == NO_SLIDE_AVAILABLE) {
    return
  }

  currentSlideNumber = prevSlideNumber
  if (currentSlideNumber < 0) {
    currentSlideNumber = 0
  } else {
    hideSlideImage()
    showCurrentSlide()
  }
}


/**
 * Show the modal reporting progress. This includes various loading messages, the form
 * used to type the tweet, and the confirmation.
 *
 * As you already suspect, it was a terrible idea to put all different types of modals 
 * together this way.
 */
function reportTweetingProgress(text, form, canClose, followUpMessage, followUpUrl) {
  document.querySelector('.modal .message').innerHTML = text
  document.querySelector('.modal').classList.remove('error')

  if (form) {
    document.querySelector('.form').classList.remove('overflow')
    document.querySelector('.modal .form').classList.add('visible')

    var text = window.localStorage['postCallbackTweet-' + slideToShareNumber] || 
        getTweetContentForSlide(slideToShareNumber)
    document.querySelector('.modal .form .tweet').value = text
        
    document.querySelector('.modal .form .tweet-image-preview').src = 
        getSlideImageFilename(slideToShareNumber)
  } else {
    document.querySelector('.modal .form').classList.remove('visible')
  }

  if (canClose) {
    document.querySelector('.modal').classList.add('can-close')
  } else {
    document.querySelector('.modal').classList.remove('can-close')
  }

  if (followUpMessage) {
    document.querySelector('.modal .rendered-tweet').innerHTML = ''

    oAuthObject.get('https://api.twitter.com/1.1/statuses/oembed.json?align=center&omit_script=true&url=' + encodeURIComponent(followUpUrl))
      .done(function(data) {
        document.querySelector('.modal .rendered-tweet').innerHTML = data.html
        twttr.widgets.load()
      })

    document.querySelector('.follow-up a').innerHTML = followUpMessage
    document.querySelector('.follow-up a').href = followUpUrl
    document.querySelector('.follow-up').classList.add('visible')
  } else {
    document.querySelector('.follow-up').classList.remove('visible')
  }

  document.querySelector('.modal').classList.add('visible')
  document.querySelector('.modal-shield').classList.add('visible')

  if (form) {
    // Put the text pointer at the beginning of the tweet
    document.querySelector('.modal .form .tweet').selectionStart = 0
    document.querySelector('.modal .form .tweet').selectionEnd = 0
    document.querySelector('.modal .form .tweet').focus()
    onTweetInput()
  }
}


/** 
 * Show an error modal if tweeting or authentication fails.
 */
function reportTweetingError(text, additionalData) {
  document.querySelector('.modal .message').innerHTML = text

  document.querySelector('.modal').classList.add('can-close')
  document.querySelector('.modal').classList.add('error')
  document.querySelector('.modal').classList.add('visible')
  document.querySelector('.modal-shield').classList.add('visible')

  console.log('ERROR', text, additionalData)
}


/**
 * Close the modal. This can happen by tapping/clicking X or pressing Esc.
 */
function closeModal() {
  if (document.querySelector('.modal').classList.contains('can-close')) {
    document.querySelector('.modal').classList.remove('visible')
    document.querySelector('.modal-shield').classList.remove('visible')
  }
}


/**
 * On any tweet text change, remember it, and update the counter.
 */
function onTweetInput() {
  var value = document.querySelector('.modal .tweet').value

  // At any point, save what the user’s typing into localStorage, so it can
  // be restored if the tweet fails or the page is reloaded. Also, do it per
  // each slide independently.
  window.localStorage['postCallbackTweet-' + currentSlideNumber] = 
      document.querySelector('.modal .tweet').value

  // Update the tweet counter.
  document.querySelector('.tweet-counter').innerHTML = 
      value.length + '<span class="slash">/</span>' + MAX_TWEET_LENGTH_WITH_IMAGE

  // Show the warning if the tweet is too long, and disable the posting button.
  if (value.length > MAX_TWEET_LENGTH_WITH_IMAGE) {
    document.querySelector('.form').classList.add('overflow')
    document.querySelector('.form .post-tweet').disabled = true
  } else {
    document.querySelector('.form').classList.remove('overflow')
    document.querySelector('.form .post-tweet').disabled = false
  }
}


/**
 * Get the URL of a posted tweet.
 */
function getTweetUrl(data) {
  return 'https://twitter.com/' + data.user.screen_name + '/status/' + data.id_str
}


/**
 * Get the default (starting point) tweet for a given slide.
 */
function getTweetContentForSlide(slideNumber) {
  var status = ''

  var slideInfo = SLIDE_INFO[slideNumber]

  if (typeof slideInfo.copy != 'undefined') {
    status += slideInfo.copy
  }

  if (status.length > MAX_TWEET_LENGTH_WITH_IMAGE - 1 - TWEET_SUFFIX.length) {
    status = status.substr(0, MAX_TWEET_LENGTH_WITH_IMAGE - 2 - TWEET_SUFFIX.length) + '…'
  }

  status += ' ' + TWEET_SUFFIX

  return status
}


/** 
 * Grab an <img> image and return a base64 data stream instead.
 */
function getRawImageData(el) {
  // Create an empty canvas element, draw an image on it
  var canvas = document.createElement("canvas")
  var width = el.naturalWidth
  var height = el.naturalHeight
  canvas.width = width
  canvas.height = height
  var ctx = canvas.getContext('2d')
  ctx.drawImage(el, 0, 0)

  var data = canvas.toDataURL()
  data = data.substr(data.indexOf(',') + 1) // Removes the base64 and MIME header
  return data
}


/** 
 * Opens the “post tweet” modal allowing the user to type in their tweet and post it.
 */
function openTweetModal() {
  // Remember the slide number separate so that we’re still good 
  // if the slide auto-advances in the background below the modal
  slideToShareNumber = currentSlideNumber
  reportTweetingProgress('Type your tweet', true, true)
  event.preventDefault()
}


/**
 * What happens on when the user composes a tweet and taps/clicks on the TWEET > 
 * button. Most often, this will result in going through a page redirect to 
 */
function onPostTweetButton() {
  reportTweetingProgress('Authenticating…', false, false)

  // We save the number of the slide to share since we are likely to have to reload
  // the page. The text of the tweet is already in localStorage because of onTweetInput().
  window.localStorage['slideToShareNumber'] = slideToShareNumber

  if (!oAuthObject) {
    // We redirect to the same page. OAuth provides a .popup option, but that doesn’t
    // work well for mobile… so we just do a redirect.
    //
    // location.href means the current URL, so we will eventually arrive at the very same
    // page, where processAuthCallback() will take over
    OAuth.redirect('twitter', location.href) 
  } else {
    postTweetWhenAuthenticated()
  }
}


/**
 * Actually post the tweet. We are authenticated to Twitter and we can use its API
 */
function postTweetWhenAuthenticated() {
  // First, we grab the image and prepare its base64 representation.

  reportTweetingProgress('Preparing image…', false, false)
  var imageBase64Data = getRawImageData(slideImages[slideToShareNumber])

  // Then we upload it to Twitter.

  reportTweetingProgress('Uploading image…', false, false)

  oAuthObject.post(
    'https://upload.twitter.com/1.1/media/upload.json',
    {
      data: { media: imageBase64Data }
    }
  ).done(function(data) {

    // On success, put the tweet together.

    var mediaId = data.media_id_string // Note: Use the string since using just id causes random problems!

    reportTweetingProgress('Tweeting…', false, false)

    var status = 
        window.localStorage['postCallbackTweet-' + slideToShareNumber] || 
        getTweetContentForSlide(slideToShareNumber)

    // Post the tweet!

    oAuthObject.post(
      'https://api.twitter.com/1.1/statuses/update.json',
      {
        data: {
          status: status,
          media_ids: mediaId
        }
      }
    ).done(function(data) {
      // On success, show the confirmation screen with the preview of user’s 
      // just-created tweet.

      var url = getTweetUrl(data)
      reportTweetingProgress('Your tweet has been posted:', false, true, 'View tweet', url)
    }).fail(function(error) {
      reportTweetingError('Sorry, failed to post a tweet. You should try again…', error.responseText)
    })

  }).fail(function(error) {
    reportTweetingError('Sorry, failed to upload the image. You should try again…', error.responseText)
  })
}


/**
 * On page entry, see if we just came back here from authentication screens. If so, deal
 * with them. 
 */
function processAuthCallback() {
  OAuth.initialize(OAUTH_PUBLIC_KEY)

  OAuth.callback('twitter', function (error, success) { 
    if (error) {
      reportTweetingError('Sorry, failed to authenticate. You should try again…', error)
    } else {
      oAuthObject = success

      if (window.localStorage['slideToShareNumber']) {
        // Retrieve the number of the slide to share from localStorage. Ideally,
        // we would use the URL to pass the slide number and message to itself,
        // but localStorage seems to be easier and great.
        slideToShareNumber = parseInt(window.localStorage['slideToShareNumber'])
        delete window.localStorage['slideToShareNumber']

        // After page reload, we need to wait for the slide image to load before
        // we attempt to tweet it
        reportTweetingProgress('Loading…', false, false)
        loadSlide(slideToShareNumber, postTweetWhenAuthenticated)
      }
    }
  })    
}


/**
 * React to key presses.
 */
function onBodyKeyDown(event) {
  switch (event.keyCode) {
    // Esc: Close the modal.
    case 27: // Esc
      closeModal()
      event.preventDefault()
      break

    // Left and right arrow: Move between the slides
    case 37:
    case 39:
      // Don’t do it if we’re actually editing the tweet or something.
      if ((document.activeElement.tagName != 'INPUT') && (document.activeElement.tagName != 'TEXTAREA')) {
        if (event.keyCode == 39) {
          goNextSlide()
        } else {
          goPrevSlide()
        }
        event.preventDefault()
      }
      break
  }
}


/**
 * Add event listeners. Mostly click events to various buttons on the page.
 */
function addEventListeners() {
  document.querySelectorAll('nav').forEach(function(el) {
    el.querySelector('.prev').addEventListener('click', goPrevSlide)
    el.querySelector('.next').addEventListener('click', goNextSlide)
    el.querySelector('.current').addEventListener('click', goMaxSlide)
    el.querySelector('.share-on-twitter').addEventListener('click', openTweetModal)

    el.querySelector('.prev').addEventListener('touchstart', goPrevSlide)
    el.querySelector('.next').addEventListener('touchstart', goNextSlide)
    el.querySelector('.current').addEventListener('touchstart', goMaxSlide)
    el.querySelector('.share-on-twitter').addEventListener('touchstart', openTweetModal)
  })

  document.querySelector('.modal .close').addEventListener('click', closeModal)
  document.querySelector('.modal .tweet').addEventListener('input', onTweetInput)
  document.querySelector('.modal .post-tweet').addEventListener('click', onPostTweetButton)

  document.body.addEventListener('keydown', onBodyKeyDown)
}


/**
 * On page resize, resize the slide image so it fills out available space.
 */
function onResize() {
  var imgCanvasWidth = document.querySelector('.current-slide').offsetWidth
  var imgCanvasHeight = document.querySelector('.current-slide').offsetHeight

  // This is kind of shitty. It might be possible to do it all via CSS without using JS,
  // but I failed (background contain makes sense, but it needs to be <img> so 
  // people can right-click on it). It’s definitely possible to rewrite to use actual 
  // image dimensions instead of hardcoded 4:3
  var imgWidth = imgCanvasWidth
  var imgHeight = imgWidth / 4 * 3
  if (imgHeight > imgCanvasHeight) {
    var imgHeight = imgCanvasHeight
    var imgWidth = imgHeight / 3 * 4
  }

  // Resize and center the slide image.
  var imgEl = document.querySelector('.current-slide img')
  imgEl.style.width = imgWidth + 'px'
  imgEl.style.height = imgHeight + 'px'
  imgEl.style.left = ((imgCanvasWidth - imgWidth) / 2) + 'px'
  imgEl.style.top = ((imgCanvasHeight - imgHeight) / 2) + 'px'
}


/**
 * Resize the image on body load also, since the fonts will have (probably) loaded
 * by then…
 */
function onBodyLoad() {
  onResize()
}


/**
 * Get the URL of the server (“production” or local depending on the settings.
 */
function getServerUrl() {
  return useLocalServer ? SERVER_URL_LOCAL : SERVER_URL
}


/**
 * Get the URL of the websockets server (“production” or local depending on the settings.
 */
function getWebsocketsServerUrl() {
  return useLocalServer ? SERVER_URL_WEBSOCKETS_LOCAL : SERVER_URL_WEBSOCKETS
}


/** 
 * Start websockets connection.
 */
function startWebsocketsServerConnection() {
  var socket = io(getWebsocketsServerUrl())

  socket.on('update-slide-data', onUpdateSlideDataSocket)
}


/**
 * The server pinged us back with data via websockets! This means that the presenter 
 * changed their slide. 
 */
function onUpdateSlideDataSocket(data) {
  console.log('Received socket with data…', data)
  processServerData(data)

  // Restart polling. We only use polling when we don’t hear from the server via
  // websockets, and since we just heard from them…
  resetPolling()
}


/**
 * Request the data manually from the server (instead of waiting for websockets).
 * Schedule the next request too, based on when we scheduled last.
 */
function pollData(doNotSchedule) {
  if (stopSyncing) {
    return;
  }

  console.log('Polling…')
  $.getJSON(getServerUrl(), onPollDataReceived)

  if (!doNotSchedule) {
    pollTimeoutTablePos++
    if (pollTimeoutTablePos == POLL_TIMEOUT_SEQUENCE.length) {
      pollTimeoutTablePos = POLL_TIMEOUT_SEQUENCE.length - 1
    }
    scheduleNextPolling()
  }
}


/**
 * The server returned us some data from our GET request. Let’s process it.
 */
function onPollDataReceived(data) {
  console.log('Received poll data…', data)
  processServerData(data)
}


/**
 * Schedule the next polling event.
 */
function scheduleNextPolling() {
  if (stopSyncing) {
    return;
  }

  window.clearTimeout(pollTimeoutTimerId)
  pollTimeoutTimerId = 
      window.setTimeout(pollData, POLL_TIMEOUT_SEQUENCE[pollTimeoutTablePos] * 1000)
}


/**
 * Cancel the next polling event.
 */
function resetPolling() {
  window.clearTimeout(pollTimeoutTimerId)
  pollTimeoutTablePos = 0
  scheduleNextPolling()
}


/**
 * Process the data returned by the server (either via websockets or GET).
 */
function processServerData(data) {
  // The new max slide number! (The presenter moved their slide ahead).
  var newMaxSlideNumber = parseInt(data.slideMax)

  // Are we pressed on time?
  if (data.skipIfPressedOnTime) {
    skipIfPressedOnTime = data.skipIfPressedOnTime
  } else {
    skipIfPressedOnTime = false
  }

  // Don’t do anything if the presentation’s over
  if (data.presentationOver) {
    console.log('Presentation’s over!')
    stopSyncing = true
    showCurrentSlide()
  }

  // Update the max slide number only if it’s bigger than the one before so that the presenter
  // moving in reverse won’t limit your slides.
  if (newMaxSlideNumber != NO_MAX_SLIDE_NUMBER_AVAILABLE_YET && newMaxSlideNumber > maxSlideNumber) {
    var oldMaxSlideNumber = maxSlideNumber
    maxSlideNumber = newMaxSlideNumber

    // If the user is looking at the max slide, move the slide for them
    if ((!stopSyncing && ((oldMaxSlideNumber == NO_MAX_SLIDE_NUMBER_AVAILABLE_YET) || (currentSlideNumber == oldMaxSlideNumber - 1))) ||
       ((data.presentationOver && currentSlideNumber == oldMaxSlideNumber - 1))) {
      currentSlideNumber = maxSlideNumber - 1
    }

    showCurrentSlide()
  }  
}


/**
 * Load parameters from the URL. Those are meant for the creator, not for the user.
 */
function readUrlParameters() {
  presenterOverride = (location.href.indexOf('?override') != -1) ||
                     (location.href.indexOf('&override') != -1)

  useLocalServer = (location.href.indexOf('?local') != -1) ||
                     (location.href.indexOf('&local') != -1)
}


/**
 * Main entry point.
 */
function main() {
  NodeList.prototype.forEach = HTMLCollection.prototype.forEach = Array.prototype.forEach

  window.addEventListener('load', onBodyLoad)

  readUrlParameters()

  // Presenter override means we are seeing all the slides.
  if (presenterOverride) {
    stopSyncing = true

    for (var i in SLIDE_INFO) {
      SLIDE_INFO[i].skipInCompanion = false
      SLIDE_INFO[i].skipIfPressedOnTime = false
      maxSlideNumber = SLIDE_INFO.length
    }
  }

  if ('ontouchstart' in document.documentElement) {
    document.body.classList.add('touch')
  }

  // Clears # fragment from the URL. It’s annoying, and happens because of OAuth flow.
  if (location.href.indexOf('#') != -1) {
    window.history.replaceState('', '', location.href.substr(0, location.href.indexOf('#')))
  }

  // Prepare the page
  window.addEventListener('resize', onResize)
  onResize()
  addEventListeners()

  showCurrentSlide()
  processAuthCallback()

  // For presenter override, we don’t need any syncing.
  if (!stopSyncing) {
    // Otherwise start the websockets connection… If it’s successful, the server will
    // get back to use immediately with the status
    startWebsocketsServerConnection()

    // …if it’s not, we also immediately ask for a status via GET
    pollData(true)

    // And also start the backup polling, since I heard websockets are not reliable
    resetPolling()
  }
}
