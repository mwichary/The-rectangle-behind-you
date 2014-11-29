var totalScore = [0, 0];
var curQuestionScore = [0, 0];

var curCategoryNo = -1;
var curQuestionNo = -1;
var curAwardedTeam = -1;  

var curTeam = 0;

var curGroupName = 'start';

var scoreToAddDefault = 0;

var oldSlide = 0;
var curSlide = 0;

var categoryQuestionEl = null;
var categoryQuestionPos = null;

var slideTransitionInProgress = false;
var textTransitionInProgress = false;
var fastTextTransition = false;
var transitionsInProgress = false;

var inputMode = false;

var MAX_VOTE_BAR_LENGTH = 30;

var SLIDE_TRANSITION_TIME = 750;

var CODE_MAX_HEIGHT = 550;

var AFTERIMAGE_COUNT = 1;

var SLIDE_MOVE_COLD_JUMP = 0;
var SLIDE_MOVE_REGULAR = 1;
var SLIDE_MOVE_SCOREBOARD = 2;
var SLIDE_MOVE_GROUP = 3;

var CATEGORY_COUNT = 5;
var QUESTION_PER_CATEGORY = 4;

var QUESTION_CATEGORIES = 
[
  ['ms-pac-man', 'cartridges', 'published', 'character'],
  ['run-away', 'levels', 'advantage', 'dots'],
  ['graphic-elements', 'framerate', 'browsers-trouble', 'first'],
  ['interesting-bug', 'control', 'time', 'lines'],
  ['html5', 'complaints', 'real-tweet', 'fan-proposal']
];

var SCORES = [200, 400, 800, 1600];

var selectedQuestions = [['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', '']];


function addToScore(teamNo) {
  if (inputMode) {
    return;
  }
  
  screenWidth = window.innerWidth;
  screenHeight = window.innerHeight;
  
  inputMode = true;
  
  document.body.classList.add('input-active');
  
  inputModeTeamNo = teamNo;
  
  inputModeEl = document.createElement('input');
  inputModeEl.id = 'big-score';
  inputModeEl.value = scoreToAddDefault + '';
  inputModeEl.style.left = 0;
  inputModeEl.style.width = screenWidth + 'px';
  inputModeEl.style.top = (screenHeight / 2) + 'px';
  
  document.body.appendChild(inputModeEl);
  
  inputModeEl.addEventListener('keydown', handleBigScoreKeyPress, false);
  inputModeEl.focus();

}

function changeMainMenuBox(categoryNo, questionNo, type) {
  var el = getCategoryQuestionEl(categoryNo, questionNo);

  el.classList.add('no-resize');

  switch (type) {
    case -1:
      el.innerHTML = '';
      break;
    case 0:
      el.innerHTML = '<img src="images/ui/team0icon.png">';
      break;
    case 1:
      el.innerHTML = '<img src="images/ui/team1icon.png">';
      break;
    case 2:
      el.innerHTML = '<img src="images/ui/team0icon.png"><img src="images/ui/team1icon.png">';
      break;
  }
}

function handleBigScoreKeyPress(event) {
  if (event.keyCode == 13) {
    var number = parseInt(inputModeEl.value);
    
    totalScore[inputModeTeamNo] += number;

    if (number > 0) {
      if (curCategoryNo != -1) {
        if (curAwardedTeam == -1) {
          curAwardedTeam = inputModeTeamNo;
        } else if (curAwardedTeam != inputModeTeamNo) {
          curAwardedTeam = 2;
        }
        changeMainMenuBox(curCategoryNo, curQuestionNo, curAwardedTeam);
      }
    }

    var destEl = document.querySelector('#score' + inputModeTeamNo);

    inputModeEl.blur();
    
    var inputPos = getElPos(inputModeEl);
    var pos = getElPos(destEl);
    
    var left = (-inputPos.left + pos.left - inputModeEl.offsetWidth / 2) / .4;
    var top = (-inputPos.top + pos.top - inputModeEl.offsetHeight / 2) / .4;
    
    inputModeEl.style.webkitTransition = '-webkit-transform 500ms ease-in-out, opacity 500ms';
    inputModeEl.style.webkitTransform = 'scale(.4) translateX(' + left + 'px) translateY(' + top + 'px)';
    inputModeEl.style.webkitTransformOrigin = '50% 50%';
    inputModeEl.style.opacity = .25;
    inputModeEl.style.webkitAnimation = '';
    
    window.setTimeout(updateScoreDisplay, 500);
    window.setTimeout(finishInputMode, 500);

    event.preventDefault();
  } else if (event.keyCode == 27) {
    finishInputMode();
    event.preventDefault();
    event.stopPropagation();
  }
}

function updateScoreDisplay() {
  var score0 = parseInt(document.getElementById('score0').innerHTML);
  var score1 = parseInt(document.getElementById('score1').innerHTML);
  
  if (totalScore[0] != score0) {
    if (score0 <= totalScore[0] - 100) {
      score0 += 100;
    } else if (score0 >= totalScore[0] + 100) {
      score0 -= 100;
    } else if (score0 <= totalScore[0] - 10) {
      score0 += 10;
    } else if (score0 >= totalScore[0] + 10) {
      score0 -= 10;
    } else if (score0 < totalScore[0]) {
      score0++;
    } else {
      score0--;
    }
  }

  if (totalScore[1] != score1) {
    if (score1 <= totalScore[1] - 100) {
      score1 += 100;
    } else if (score1 >= totalScore[1] + 100) {
      score1 -= 100;
    } else if (score1 <= totalScore[1] - 10) {
      score1 += 10;
    } else if (score1 >= totalScore[1] + 10) {
      score1 -= 10;
    } else if (score1 < totalScore[1]) {
      score1++;
    } else {
      score1--;
    }
  }
  
  document.getElementById('score0').innerHTML = score0;
  document.getElementById('score1').innerHTML = score1;

  document.getElementById('final-score-0').innerHTML = score0;
  document.getElementById('final-score-1').innerHTML = score1;
  
  if ((score0 != totalScore[0]) || (score1 != totalScore[1])) {
    window.setTimeout(updateScoreDisplay, 50);
  }
}

function finishInputMode() {
  inputMode = false;
  
  document.body.removeChild(inputModeEl);

  document.body.classList.remove('input-active');
}


function getElPos(el) {
  var pos = {};
  
  pos.left = 0;
  pos.top = 0;
  
  while (el) {
    pos.left += el.offsetLeft;
    pos.top += el.offsetTop;
    
    el = el.offsetParent;
  }
  
  return pos;
}

function getCategoryEl(categoryNo) {
  return document.querySelectorAll('table.main-menu tr')[categoryNo].querySelector('th');
}

function getCategoryQuestionEl(categoryNo, questionNo) {
  return document.querySelectorAll('table.main-menu tr')[categoryNo].querySelectorAll('td')[questionNo];
}

function countFinishedQuestionsInACategory(categoryNo) {
  var count = 0;
  
  for (var i in selectedQuestions[categoryNo]) {
    if (selectedQuestions[categoryNo][i]) {
      count++;
    }
  }
  
  return count;
}

function selectQuestion(categoryNo, questionNo) {
  categoryQuestionEl = getCategoryQuestionEl(categoryNo, questionNo);
  
  curCategoryNo = categoryNo;
  curQuestionNo = questionNo;
  curAwardedTeam = -1;
  
  scoreToAddDefault = SCORES[questionNo];
  
  if (!selectedQuestions[categoryNo][questionNo]) {
    var count = countFinishedQuestionsInACategory(categoryNo);
    
    var group = QUESTION_CATEGORIES[categoryNo][count];
    
    selectedQuestions[categoryNo][questionNo] = group;
  }
  
  jumpToGroup(selectedQuestions[categoryNo][questionNo]);
  
  changeMainMenuBox(curCategoryNo, curQuestionNo, -1);
}

function updateTransitionsInProgressIndicators() {
  if (slideTransitionInProgress || textTransitionInProgress) {
    newTransitionsInProgress = true;
  } else {
    newTransitionsInProgress = false;    
  }
  
  if (newTransitionsInProgress != transitionsInProgress) {
    transitionsInProgress = newTransitionsInProgress;
  }
}

function slideTransitionEnded() {
  slideTransitionInProgress = false;
  updateTransitionsInProgressIndicators();  
  
  slideEls[curSlide].focus();
}

function slideTransitionInProgress() {
  slideTransitionInProgress = true;
}

function changeSlideElClass(no, className) {
  if ((no < 0) || (no > slideEls.length - 1)) {
    return;
  }
  
  var el = slideEls[no];
  
  if (el.classList.contains('current') || 
      el.classList.contains('current-up') || 
      el.classList.contains('current-down')) {
    var iframeEl = el.querySelector('iframe');
    if (iframeEl && iframeEl.contentWindow && iframeEl.contentWindow.onslideleave) { 
      iframeEl.contentWindow.onslideleave(); 
    }
    
    var videoEl = el.querySelector('video');
    if (videoEl) {
      window.setTimeout(function() { videoEl.pause(); }, 500);
    }
    
    document.body.classList.remove('slide-class-' + el.getAttribute('slideclass'));
  }
  
  el.classList.remove('prev-up');
  el.classList.remove('prev-down');
  el.classList.remove('current');
  el.classList.remove('current-up');
  el.classList.remove('current-down');
  el.classList.remove('next-up');
  el.classList.remove('next-down');

  el.classList.remove('enlarge');
  el.classList.remove('shrink');
  el.classList.remove('fade-in');
  el.classList.remove('fade-out');

  if (className) {
    el.classList.add(className);    
  }
}

function getCurSlideFromHash() {
  var number = location.hash.substr(1);
  
  if (parseInt(number)) {
    curSlide = parseInt(number) - 1;
  }
}

function updateSlideHash() {
  location.replace('#' + (curSlide + 1));
}

function activateIframe() {
  var el = slideEls[curSlide].querySelector('iframe');
  
  if (el) {
    window.setTimeout( function() { if (el.contentWindow.onslideenter) { el.contentWindow.onslideenter(); } }, 0);
  }
}

function changeSlide(directionUp, moveType) {
  slideTransitionInProgress = true;
  updateTransitionsInProgressIndicators();  

  moveSlide(directionUp, moveType);
  
  updateSlideHash();
  
  activateIframe();
  
  if (slideEls[curSlide].getAttribute('slideclass')) {
    document.body.classList.add('slide-class-' + slideEls[curSlide].getAttribute('slideclass'));
  }
    
  coverEl.className = slideEls[curSlide].className;
}

function moveSlide(directionUp, moveType) {
  switch (moveType) {
    case SLIDE_MOVE_REGULAR:
      for (var i = 0; i < slideEls.length; i++) {
        if ((i < curSlide - 1) || (i > curSlide + 1)) {
          changeSlideElClass(i, '');
        }
      }

      changeSlideElClass(curSlide - 1, directionUp ? 'prev-up' : 'prev-down');
      changeSlideElClass(curSlide, directionUp ? 'current-up' : 'current-down');
      changeSlideElClass(curSlide + 1, directionUp ? 'next-up' : 'next-down');
      break;
    case SLIDE_MOVE_COLD_JUMP:
      for (var i = 0; i < slideEls.length; i++) {
        if (i != curSlide) {
          changeSlideElClass(i, '');
        }
      }
      changeSlideElClass(curSlide, 'current');

      break;
    case SLIDE_MOVE_SCOREBOARD:
      for (var i = 0; i < slideEls.length; i++) {
        if ((i != curSlide) && (i != oldSlide)) {
          changeSlideElClass(i, '');
        }
      }
      if (categoryQuestionPos) {
        slideEls[oldSlide].style.webkitTransformOrigin = 
            categoryQuestionPos.left + 'px ' + categoryQuestionPos.top + 'px';
      }

      changeSlideElClass(curSlide, 'fade-in');
      changeSlideElClass(oldSlide, 'shrink');

      break;
    case SLIDE_MOVE_GROUP:
      for (var i = 0; i < slideEls.length; i++) {
        if ((i != curSlide) && (i != oldSlide)) {
          changeSlideElClass(i, '');
        }
      }
      
      if (categoryQuestionEl) {
        categoryQuestionPos = getElPos(categoryQuestionEl);
        categoryQuestionPos.top -= presentationEl.offsetTop;      
        slideEls[curSlide].style.webkitTransformOrigin = 
            categoryQuestionPos.left + 'px ' + categoryQuestionPos.top + 'px';
      }
      
      
      changeSlideElClass(curSlide, 'enlarge');
      changeSlideElClass(oldSlide, 'fade-out');

      break;
  }
  
  window.setTimeout(slideTransitionEnded, SLIDE_TRANSITION_TIME);
}

function createAfterimageElements() {
  if (slideEls[curSlide].afterimageEls && slideEls[curSlide].afterimageEls.length) {
    return;
  }

  slideEls[curSlide].afterimageEls = [];
  
  for (var i = 0; i < AFTERIMAGE_COUNT; i++) {
    var el = document.createElement('slide');

    el.className = slideEls[curSlide].className; 
    
    el.classList.remove('prev-up');
    el.classList.remove('prev-down');    
    el.classList.remove('current-up');
    el.classList.remove('current-down');
    el.classList.remove('next-up');
    el.classList.remove('next-down');
    
    el.classList.add('afterimage');
    el.classList.add('dormant');
    el.classList.add('afterimage' + (i + 1)); 
    
    el.innerHTML = slideEls[curSlide].innerHTML;
    
    slidesEl.appendChild(el);
    
    slideEls[curSlide].afterimageEls.push(el);
  }  
}

function playAfterimages(slideNo) {
  var elList = slideEls[slideNo].afterimageEls;
  
  for (var i in elList) {
    elList[i].classList.remove('dormant');
  }
  
  window.setTimeout(function() { playAfterimagesPart2(slideNo, elList); }, 0);
}

function playAfterimagesPart2(slideNo) {
  var slideEl = slideEls[slideNo];
  
  if (!slideEl) {
    return;
  }
  var elList = slideEl.afterimageEls;
  
  for (var i in elList) {
    elList[i].classList.add('play');
  }
  
  window.setTimeout(function() { removeAfterimages(slideEl, elList); }, 5500);
}

function removeAfterimages(slideEl, elList) {
  for (var i in elList) {
    if (elList[i].parentNode) {
      elList[i].parentNode.removeChild(elList[i]);
    }
  }

  slideEl.afterimageEls = [];
}

function findFirstSlideInGroup(groupName) {
  var el = document.querySelector('slide[group="' + groupName + '"]');
  
  return parseInt(el.no);
}

function jumpToGroup(groupName) {
  if (curGroupName == groupName) {
    
    // Esc repeatedly on the scoreboard switches teams
    if (groupName == 'scoreboard') {
      document.body.classList.remove('team-0');
      document.body.classList.remove('team-1');

      curTeam = 1 - curTeam;
      document.body.classList.add('team-' + curTeam);
    }
    
    return;
  }
  
  var no = findFirstSlideInGroup(groupName);

  oldSlide = curSlide;
  curSlide = no;
  
  if ((groupName == 'start') || (groupName == 'finale') || (curGroupName == 'start')) {
    scoreToAddDefault = 0;
    changeSlide(true, SLIDE_MOVE_REGULAR);
  } else if (groupName == 'scoreboard') {
    scoreToAddDefault = 0;
    changeSlide(true, SLIDE_MOVE_SCOREBOARD);  
  } else {
    changeSlide(true, SLIDE_MOVE_GROUP);      
  }  
  
  curQuestionScore = [0, 0];
  curGroupName = groupName;
  
  if (groupName == 'scoreboard') {
    document.body.classList.remove('team-0');
    document.body.classList.remove('team-1');

    curTeam = 1 - curTeam;
    document.body.classList.add('team-' + curTeam);
  }
  
  if (groupName == 'finale') {
    document.body.classList.remove('team-0');
    document.body.classList.remove('team-1');

    if (totalScore[0] > totalScore[1]) {
      curTeam = 1;
    } else {
      curTeam = 0;
    }
    document.body.classList.add('team-' + curTeam);
    
    scoreToAddDefault = Math.abs(totalScore[0] - totalScore[1]) + 10;
    document.getElementById('finale-score-total').innerHTML = scoreToAddDefault;    
  }
}

function jumpToScoreboard() {
  jumpToGroup('scoreboard');
}

function prevSlide() {
  if (transitionsInProgress) {
    return;
  }
  
  if (curSlide == 0) {
    return;
  }
  if (slideEls[curSlide].getAttribute('group') == 'scoreboard') {
    jumpToGroup('start');
    return;
  } 
  if (slideEls[curSlide].getAttribute('group')) {
    jumpToScoreboard();
    return;
  }
  
  createAfterimageElements();    
  window.setTimeout(function(curSlide) { playAfterimages(curSlide); }(curSlide), 0);

  curSlide--;
  changeSlide(false, SLIDE_MOVE_REGULAR);
}

function nextSlide() {
  if (transitionsInProgress) {
    return;
  }
    
  if (slideEls[curSlide].getAttribute('group') == 'scoreboard') {
    return;
  }
  if (slideEls[curSlide].getAttribute('nextgroup')) {
    jumpToGroup(slideEls[curSlide].getAttribute('nextgroup'));
    return;
  }
  if (!slideEls[curSlide + 1] || slideEls[curSlide + 1].getAttribute('group')) {
    jumpToScoreboard();
    return;
  }
  
  createAfterimageElements();    
  window.setTimeout(function(curSlide) { playAfterimages(curSlide); }(curSlide), 0);

  curSlide++;
  changeSlide(true, SLIDE_MOVE_REGULAR);
}

function playWinSound() {
  document.getElementById('sound-extra-life').play();
}

function playLoseSound() {
  document.getElementById('sound-death').play();  
}

function playAttractSound() {
  document.getElementById('sound-ambient').play();
}

function handleBodyKeyPress(event) {
  if (inputMode) {
    return;
  }
  
  switch (event.keyCode) {
    case 32:
    case 39: // right
    case 40: // down
    case 13: // Enter
      nextSlide();
      event.preventDefault();
      break;

    case 37: // left
    case 38: // up
      prevSlide();
      event.preventDefault();
      break;
      
    case 27: // Esc
      jumpToScoreboard();
      event.preventDefault();
      break;
      
    case 189: // minus
      playLoseSound();
      event.preventDefault();
      break;
    case 187: // plus
      playWinSound();
      event.preventDefault();
      break;
    case 76: // L
      playAttractSound();
      event.preventDefault();
      break;
    case 82: // R:
      if (event.shiftKey) {
        var el = getSlideIframe(curSlide);
      
        if (el) {
          el.originalsrc = el.src;
          el.src = 'about:blank';
          
          window.setTimeout(function() { el.src = el.originalsrc; }, 500);
        }

        //alert(1);
        event.preventDefault();
      }
      break;
    case 70: // F
      jumpToGroup('finale');
      event.preventDefault();
      break;
      
    case 48: // 0
      document.body.webkitRequestFullScreen();
      event.preventDefault();
      break;        
  }
}

function resizeElementsToFit(slideEl) {
  slideEl.classList.add('temporary-visible');
  
  /* Question */
  
  if (slideEl.classList.contains('question')) {
    if (slideEl.scrollHeight > slideEl.offsetHeight - 50) {
      slideEl.classList.add('smaller1');
    }
  }
  
  /* Tweet */
  
  if (slideEl.classList.contains('tweet')) {
    if (slideEl.scrollHeight > slideEl.offsetHeight + 50) {
      slideEl.classList.add('smaller1');
    }
  }
  
  /* Code */
  
  var codeEl = slideEl.querySelector('pre');
  
  if (codeEl) {
    if (codeEl.offsetHeight > CODE_MAX_HEIGHT) {
      codeEl.classList.add('smaller1');
    }
  }
  
  /* Answers */
  
  if (slideEl.classList.contains('answers')) {
    if (slideEl.scrollHeight > slideEl.offsetHeight) {
      slideEl.classList.add('smaller1');
    }

    if (slideEl.scrollHeight > slideEl.offsetHeight + 20) {
      slideEl.classList.add('smaller2');
    }
  }

  slideEl.classList.remove('temporary-visible');  
}

function playPauseVideoEl(el) {
  if (el.paused) {
    el.play();    
  } else {
    el.pause();
  }    
}

function playPauseVideo(event) {
  var el = event.target;
  
  playPauseVideoEl(el);
}

function prepareVideos(slideEl) {
  var videoEl = slideEl.querySelector('video');
  
  if (videoEl) {
    videoEl.addEventListener('click', playPauseVideo, false);
  }  
}

function prepareAnswers(slideEl) {
  if (slideEl.classList.contains('answers')) {
    
    // Find the group it belongs to
    var el = slideEl;
    do {
      el = el.previousSibling;
    } while (!el.getAttribute || !el.getAttribute('group'));
    slideEl.setAttribute('origgroup', el.getAttribute('group'));    
    
    var els = slideEl.querySelectorAll('li');
    
    for (var i = 0, el; el = els[i]; i++) {
      var answerEl = document.createElement('div');
      answerEl.classList.add('answer-counter');
      
      answerEl.innerHTML = '';
      
      el.appendChild(answerEl);
    }
  }  
}

function prettifySlides() {
  var els = document.querySelectorAll('pre');

  for (var i = 0, el; el = els[i]; i++) {
    if (!el.classList.contains('noprettyprint')) {
      el.classList.add('prettyprint');
    }
  }
  
  prettyPrint();
}

function processSlides() {
  prettifySlides();
  
  for (var i = 0, el; el = slideEls[i]; i++) {
    el.no = i;
    
    prepareVideos(el);
    prepareAnswers(el);
    resizeElementsToFit(el);
  }
}

function removeStringWhitespace(string) {
  string = string.replace(/^[\s]*/, '');
  string = string.replace(/[\s]*$/, '');
  string = string.replace(/[\n]/g, ' ');
  string = string.replace(/\ \ /g, ' ');
  string = string.replace(/\ \ /g, ' ');
  string = string.replace(/\ \ /g, ' ');
  string = string.replace(/\ \ /g, ' ');
  
  return string;
}

function getSlideIframe(slideNo) {
  var iframeEls = slideEls[curSlide].getElementsByTagName('iframe');
  if (iframeEls && iframeEls[0]) {
    var el = iframeEls[0];
    return el;
  }
  
  return false;
}

function initialize() {
  presentationEl = document.getElementsByTagName('presentation')[0];
  slidesEl = document.getElementsByTagName('slides')[0];
  slideEls = document.getElementsByTagName('slide');
  coverEl = document.querySelector('cover');
  debugEl = document.getElementById('debug');
  
  processSlides();

  window.addEventListener('keydown', handleBodyKeyPress, false);

  getCurSlideFromHash();
  
  changeSlide(true, SLIDE_MOVE_COLD_JUMP);  
}