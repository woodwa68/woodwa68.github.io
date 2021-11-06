// Usage: requires a version of fullPage.js that incorporates
// pull request #1498: https://github.com/alvarotrigo/fullPage.js/pull/1498
//
// Then initialize fullPage.js and set this object to the
// scrollOverflowHandler option.
// ```
//     scrollOverflow: true,
//     scrollOverflowHandler: iscrollHandler,
// ```

// Warning: this is a proof-of-concept for using
// iscroll to replace jquery.slimScroll for handling
// content larger than the window height and has
// not had thorough cross-browser testing.
// Provided AS IS.

'use strict';

// This example uses CommonJS modules and assumes you can
// require jquery and iscroll using something like browserify
// or webpack.
// However, if you use require.js or plain script tags to
// add jQuery and IScroll to the current scope instead,
// the rest of the code here will work as is.

var jQuery = require('jquery');
var IScroll = require('iscroll');

// Private constants from fullpage.js
// Unfortunately they can't be configured or imported

var SCROLLABLE =            'fp-scrollable';
var SCROLLABLE_SEL =        '.' + SCROLLABLE;
var ACTIVE =                'active';
var ACTIVE_SEL =            '.' + ACTIVE;
var SLIDE =                 'fp-slide';
var SLIDE_SEL =             '.' + SLIDE;
var SLIDE_ACTIVE_SEL =      SLIDE_SEL + ACTIVE_SEL;
var SLIDES_WRAPPER =        'fp-slides';
var SLIDES_WRAPPER_SEL =    '.' + SLIDES_WRAPPER;

// We only want the iScroll to translate on touch devices.
// On overscroll, at least on iPhone, it seems to trigger a window
// scroll event which allows moving to the next section.
// If that doesn't happen, we would need to incorporate iscroll-probe
// to get access to the onscroll event and do our own determining of
// whether or not to move to the next fullpage section.
var iscrollOptions = {
    disableMouse: true,
    mouseWheel: false
};

/**
 * An object to handle overflow scrolling.
 * This uses jquery.slimScroll to accomplish overflow scrolling.
 * It is possible to pass in an alternate scrollOverflowHandler
 * to the fullpage.js option that implements the same functions
 * as this handler.
 *
 * @type {Object}
 */
var iscrollHandler = {
    /**
     * Called when overflow scrolling is needed for a section.
     *
     * @param  {Object} element      jQuery object containing current section
     * @param  {Number} scrollHeight Current window height in pixels
     */
    create: function(element, scrollHeight) {
        var scrollable = element.find(SCROLLABLE_SEL);
        scrollable.height(scrollHeight);
        scrollable.each(function() {
            let $this = jQuery(this);
            let instance = $this.data('iscrollInstance');
            if (instance) {
                instance.destroy();
            }
            instance = new IScroll($this.get(0), iscrollOptions);
            $this.data('iscrollInstance', instance);
        });
    },

    /**
     * Return a boolean depending on whether the scrollable element is a
     * the end or at the start of the scrolling depending on the given type.
     *
     * @param  {String}  type       Either 'top' or 'bottom'
     * @param  {Object}  scrollable jQuery object for the scrollable element
     * @return {Boolean}
     */
    isScrolled: function(type, scrollable) {
        var scroller = scrollable.data('iscrollInstance');
        if (!scroller) {
            return false;
        }
        if (type === 'top') {
            // console.log('top', scroller.y, scrollable.scrollTop());
            return scroller.y >= 0 && !scrollable.scrollTop();
        } else if (type === 'bottom') {
            // console.log('bottom', scroller.y, scrollable.scrollTop(), (0 - scroller.y) + scrollable.scrollTop() + 1 + scrollable.innerHeight(), scrollable[0].scrollHeight);
            return (0 - scroller.y) + scrollable.scrollTop() + 1 + scrollable.innerHeight() >= scrollable[0].scrollHeight;
        }
    },

    /**
     * Returns the scrollable element for the given section.
     * If there are landscape slides, will only return a scrollable element
     * if it is in the active slide.
     *
     * @param  {Object}  activeSection jQuery object containing current section
     * @return {Boolean}
     */
    scrollable: function(activeSection){
        // if there are landscape slides, we check if the scrolling bar is in the current one or not
        if (activeSection.find(SLIDES_WRAPPER_SEL).length) {
            return activeSection.find(SLIDE_ACTIVE_SEL).find(SCROLLABLE_SEL);
        }
        return activeSection.find(SCROLLABLE_SEL);
    },

    /**
     * Returns the scroll height of the wrapped content.
     * If this is larger than the window height minus section padding,
     * overflow scrolling is needed.
     *
     * @param  {Object} element jQuery object containing current section
     * @return {Number}
     */
    scrollHeight: function(element) {
        return element.find(SCROLLABLE_SEL).children().first().get(0).scrollHeight;
    },

    /**
     * Called when overflow scrolling is no longer needed for a section.
     *
     * @param  {Object} element      jQuery object containing current section
     */
    remove: function(element) {
        var scrollable = element.find(SCROLLABLE_SEL);
        var iscrollInstance = scrollable.data( 'iscrollInstance' );
        if (iscrollInstance) {
            iscrollInstance.destroy();
            scrollable.data( 'iscrollInstance', undefined );
        }
        element.find(SCROLLABLE_SEL).children().first().children().first().unwrap().unwrap();
    },

    /**
     * Called when overflow scrolling has already been setup but the
     * window height has potentially changed.
     *
     * @param  {Object} element      jQuery object containing current section
     * @param  {Number} scrollHeight Current window height in pixels
     */
    update: function(element, scrollHeight) {
        element.find(SCROLLABLE_SEL).parent().css('height', scrollHeight + 'px');
    },

    /**
     * Called to get any additional elements needed to wrap the section
     * content in order to facilitate overflow scrolling.
     *
     * @return {String|Object} Can be a string containing HTML,
     *                         a DOM element, or jQuery object.
     */
    wrapContent: function() {
        return '<div class="' + SCROLLABLE + '"><div class="fp-scroller"></div></div>';
    }
};

exports = module.exports = iscrollHandler;
