/**
 * --------------------------------------------------------------------------
 * Bootstrap (v5.0.1): scrollspy.js
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import { defineJQueryPlugin, isElement, reflow, typeCheckConfig } from './util/index'
import EventHandler from './dom/event-handler'
import Manipulator from './dom/manipulator'
import SelectorEngine from './dom/selector-engine'
import BaseComponent from './base-component'

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'scrollspy'
const DATA_KEY = 'bs.scrollspy'
const EVENT_KEY = `.${DATA_KEY}`
const DATA_API_KEY = '.data-api'

const Default = {
  target: null,
  rootMargin: '0px'
}

const DefaultType = {
  target: '(string|element)',
  rootMargin: '(string)'
}

const EVENT_ACTIVATE = `activate${EVENT_KEY}`
const EVENT_LOAD_DATA_API = `load${EVENT_KEY}${DATA_API_KEY}`

const CLASS_NAME_DROPDOWN_ITEM = 'dropdown-item'
const CLASS_NAME_ACTIVE = 'active'

const SELECTOR_DATA_SPY = '[data-bs-spy="scroll"]'
const SELECTOR_NAV_LIST_GROUP = '.nav, .list-group'
const SELECTOR_NAV_LINKS = '.nav-link'
const SELECTOR_NAV_ITEMS = '.nav-item'
const SELECTOR_LIST_ITEMS = '.list-group-item'
const SELECTOR_DROPDOWN = '.dropdown'
const SELECTOR_DROPDOWN_TOGGLE = '.dropdown-toggle'

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class ScrollSpy extends BaseComponent {
  constructor(element, config) {
    super(element)

    // this._element is  the observablesContainer
    this._config = this._getConfig(config)
    this._target = this._config.target

    if (!isElement(this._target)) {
      throw new TypeError('Target Container is not defined')
    }

    this._targetLinks = []
    this._activeTarget = null
    this._observableSections = []
    this._observer = null
    this.refresh() // initialize
  }

  // Getters

  static get Default() {
    return Default
  }

  static get NAME() {
    return NAME
  }

  // Public

  refresh() {
    // `${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}, .${CLASS_NAME_DROPDOWN_ITEM}`
    this._targetLinks = SelectorEngine
      .find('[href]', this._target)
      .filter(el => el.hash.length > 0)// ensure that all have id

    this._observableSections = this._targetLinks
      .map(el => SelectorEngine.findOne(el.hash, this._element))
      .filter(el => el)// filter nulls

    reflow(this._element)
    if (this._observer) {
      this._observer.disconnect()
    } else {
      this._observer = this._getNewObserver()
    }

    this._observableSections.forEach(section => this._observer.observe(section))
  }

  dispose() {
    this._observer.disconnect()
    EventHandler.off(this._scrollElement, EVENT_KEY)
    super.dispose()
  }

  // Private

  _getConfig(config) {
    config = {
      ...Default,
      ...Manipulator.getDataAttributes(this._element),
      ...(typeof config === 'object' && config ? config : {})
    }

    if (!isElement(config.target)) {
      config.target = SelectorEngine.findOne(config.target)
    }

    typeCheckConfig(NAME, config, DefaultType)

    return config
  }

  _activate(target) {
    if (this._activeTarget === target) {
      return
    }

    this._clearActiveClass()
    if (!target) {
      return
    }

    this._activeTarget = target

    target.classList.add(CLASS_NAME_ACTIVE)

    if (target.classList.contains(CLASS_NAME_DROPDOWN_ITEM)) { // Activate dropdown parents
      SelectorEngine.findOne(SELECTOR_DROPDOWN_TOGGLE, target.closest(SELECTOR_DROPDOWN))
        .classList.add(CLASS_NAME_ACTIVE)
    } else {
      SelectorEngine.parents(target, SELECTOR_NAV_LIST_GROUP)
        .forEach(listGroup => {
          // Set triggered links parents as active
          // With both <ul> and <nav> markup a parent is the previous sibling of any nav ancestor
          SelectorEngine.prev(listGroup, `${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}`)
            .forEach(item => item.classList.add(CLASS_NAME_ACTIVE))

          // Handle special case when .nav-link is inside .nav-item
          SelectorEngine.prev(listGroup, SELECTOR_NAV_ITEMS)
            .forEach(navItem => {
              SelectorEngine.children(navItem, SELECTOR_NAV_LINKS)
                .forEach(item => item.classList.add(CLASS_NAME_ACTIVE))
            })
        })
    }

    EventHandler.trigger(this._element, EVENT_ACTIVATE, {
      relatedTarget: target
    })
  }

  _clearActiveClass() {
    SelectorEngine.find(`.${CLASS_NAME_ACTIVE}`, this._target)
      .forEach(node => node.classList.remove(CLASS_NAME_ACTIVE))
  }

  _getNewObserver() {
    // IntersectionObserver triggers and return element only when is shown and when is gone (threshold: 0). So we keep visible elements here
    const visibleEntries = new Map()

    const callback = entries => {
      entries.forEach(entry => {
        const key = entry.target.id
        if (entry.isIntersecting || entry.intersectionRatio > 0.5) {
          visibleEntries.set(key, entry.target.offsetTop)
        } else {
          visibleEntries.delete(key)
        }
      })
      const firstVisible = [...visibleEntries.entries()]
        .sort((a, b) => a[1] - b[1])
        .shift()

      if (firstVisible) {
        this._activate(this._targetLinks.find(el => el.hash === `#${firstVisible[0]}`))
      }
    }

    const options = {
      root: this._element,
      threshold: 0,
      rootMargin: this._config.rootMargin
    }

    return new IntersectionObserver(callback.bind(this), options)
  }

  // Static

  static jQueryInterface(config) {
    return this.each(function () {
      const data = ScrollSpy.getOrCreateInstance(this, config)

      if (typeof config !== 'string') {
        return
      }

      if (data[config] === undefined || config.startsWith('_') || config === 'constructor') {
        throw new TypeError(`No method named "${config}"`)
      }

      data[config]()
    })
  }
}

/**
 * ------------------------------------------------------------------------
 * Data Api implementation
 * ------------------------------------------------------------------------
 */

EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
  SelectorEngine.find(SELECTOR_DATA_SPY)
    .forEach(spy => new ScrollSpy(spy))
})

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .ScrollSpy to jQuery only if jQuery is present
 */

defineJQueryPlugin(ScrollSpy)

export default ScrollSpy
