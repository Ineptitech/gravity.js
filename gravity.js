// ==UserScript==
// @name         Gravity
// @namespace    https://ineptitech.com
// @version      0.1
// @description  Make scroll bars obey the laws of physics.
// @author       yea
// @match        *://*/*
// ==/UserScript==

/*

"I was tired of the sun. Always blinding me while i'm on the computer.

I wanted rain and I thought the best way to do that was to make god cry"

    - KilianExperience, 2019

*/

var clickedOnScrollbar = function(mouseX) {
    if (document.body.clientWidth <= mouseX) {
        return true;
    }
};

var animationHandle = null;

var getScrollSize = function() {
    return document.documentElement.scrollHeight - document.documentElement.clientHeight;
};

var getScrollRatio = function() {
    return document.documentElement.scrollTop / getScrollSize();
};

var startAnimation = function() {
    // bail if already animating
    if (animationHandle && animationHandle.animating) {
        return;
    }

    // reset animation handle
    animationHandle = { animating: true };

    // parameters
    // https://physics.stackexchange.com/questions/256468/model-formula-for-bouncing-ball
    const LOSS = 0.65;
    const TIME_FIRST_FALL_SECONDS = 0.5;
    const VELOCITY_THRESHOLD = 0.001;

    // acceleration
    const GRAVITY = 1 / TIME_FIRST_FALL_SECONDS;
    
    // grab a copy, animate until we get told otherwise
    const handleCopy = animationHandle;

    // bounce state
    var currentVelocity = 0;
    var maxVelocity = Math.sqrt((1 - getScrollRatio()) * GRAVITY * 2);

    // https://physics.stackexchange.com/questions/256468/model-formula-for-bouncing-ball
    var lastTime = performance.now();
    requestAnimationFrame(function animateImpl(step) {
        // check if we're already animating
        if (!handleCopy.animating) {
            return;
        }

        const deltaTime = (step - lastTime) / 1000;
        lastTime = step;
        
        const scrollHeight = getScrollSize();
        const topRatio = getScrollRatio();

        var newTop = topRatio;

        // adjust
        newTop = newTop - (currentVelocity * deltaTime) + (0.5 * GRAVITY * deltaTime * deltaTime);
        
        // set
        document.documentElement.scrollTop = newTop * scrollHeight;

        // are we at the bottom?
        if (newTop >= 0.999) {
            // bounce
            maxVelocity = maxVelocity * (1 - LOSS);

            // bail if our current velocity is too low
            if (maxVelocity <= VELOCITY_THRESHOLD) {
                handleCopy.animating = false;
                return;
            }

            // adjust
            currentVelocity = maxVelocity;
        } else {
            // tick
            currentVelocity -= GRAVITY * deltaTime;
        }

        // step 
        requestAnimationFrame(animateImpl);
    });
};

var onScrollBar = false;
window.onmousedown = function(e) {
    onScrollBar = clickedOnScrollbar(e.clientX);
    if (animationHandle && onScrollBar) {
        animationHandle.animating = false;
    }
};

window.onmouseup = function() {
    onScrollBar = false;
};

var debounce = performance.now();
window.onwheel = function(e) {
    // reset animation on wheel
    if (animationHandle) {
        animationHandle.animating = false;
        animationHandle = null;
    }

    // reset debounce time
    debounce = performance.now();
};

setInterval(function() {
    if (!onScrollBar && (performance.now() - debounce > 80)) {
        // are we not at the bottom of the page?
        if (getScrollRatio() < 0.99) {
            // restart animation (if not animating)
            startAnimation();
        }
    }
}, 100);
