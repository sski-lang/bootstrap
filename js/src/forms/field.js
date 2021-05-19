/**
 * --------------------------------------------------------------------------
 * Bootstrap (v5.0.1): util/field.js
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */
import { isElement, typeCheckConfig } from '../util/index'
import Messages from './messages'
import Manipulator from '../dom/manipulator'
import EventHandler from '../dom/event-handler'

const NAME = 'field'
const DATA_KEY = 'bs.field'
const EVENT_KEY = `.${DATA_KEY}`
const EVENT_INPUT = `input${EVENT_KEY}`
const CLASS_PREFIX_ERROR = 'invalid'
const CLASS_PREFIX_INFO = 'info'
const CLASS_PREFIX_SUCCESS = 'valid'
const ARIA_DESCRIBED_BY = 'aria-describedby'
const Default = {
  name: null,
  type: 'feedback', // or tooltip
  valid: '', // valid message to add
  invalid: '' // invalid message to add
}

const DefaultType = {
  name: 'string',
  type: 'string',
  valid: 'string',
  invalid: 'string'
}

class Field {
  constructor(element, config) {
    this._element = element
    if (!isElement(this._element)) {
      throw new TypeError(`field "${this._config.name}" not found`)
    }

    this._config = this._getConfig(config)

    this._errorMessages = this._getNewMessagesCollection(CLASS_PREFIX_ERROR)
    this._helpMessages = this._getNewMessagesCollection(CLASS_PREFIX_INFO)
    this._successMessages = this._getNewMessagesCollection(CLASS_PREFIX_SUCCESS)

    this._initializeMessageCollections()
    this._initialDescriptedBy = this._element.getAttribute(ARIA_DESCRIBED_BY)
    this._appendedFeedback = null
    EventHandler.on(this._element, EVENT_INPUT, () => {
      this.clearAppended()
    })
  }

  getElement() {
    return this._element
  }

  clearAppended() {
    if (!this._appendedFeedback) {
      return
    }

    this._appendedFeedback.remove()
    this._appendedFeedback = null
    if (this._initialDescriptedBy) {
      this._element.setAttribute(ARIA_DESCRIBED_BY, this._initialDescriptedBy)
    } else {
      this._element.removeAttribute(ARIA_DESCRIBED_BY)
    }
  }

  dispose() {
    EventHandler.off(this._element, EVENT_KEY)
    Object.getOwnPropertyNames(this).forEach(propertyName => {
      this[propertyName] = null
    })
  }

  errorMessages() {
    return this._errorMessages
  }

  helpMessages() {
    return this._helpMessages
  }

  successMessages() {
    return this._successMessages
  }

  _getConfig(config) {
    config = {
      ...Default,
      ...Manipulator.getDataAttributes(this._element),
      ...(typeof config === 'object' ? config : {})
    }

    typeCheckConfig(NAME, config, DefaultType)
    return config
  }

  _appendFeedback(htmlElement) {
    this.clearAppended()
    if (!htmlElement) {
      return
    }

    const feedbackElement = htmlElement

    this._appendedFeedback = feedbackElement

    this._element.parentNode.insertBefore(feedbackElement, this._element.nextSibling)
    feedbackElement.id = this._getId()
    const describedBy = this._initialDescriptedBy ? `${this._initialDescriptedBy} ` : ''
    this._element.setAttribute(ARIA_DESCRIBED_BY, `${describedBy}${feedbackElement.id}`)
  }

  _getId() {
    return `${this._config.name}-formTip`
  }

  _getNewMessagesCollection(classPrefix) {
    const config = {
      appendFunction: html => this._appendFeedback(html),
      extraClass: `${classPrefix}-${this._config.type}`
    }
    return new Messages(config)
  }

  _initializeMessageCollections() {
    if (this._config.invalid) {
      this.errorMessages().set('default', this._config.invalid)
    }

    if (this._config.valid) {
      this.successMessages().set('default', this._config.valid)
    }
  }
}

export default Field
