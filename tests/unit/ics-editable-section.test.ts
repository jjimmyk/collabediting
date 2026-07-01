/**
 * @vitest-environment happy-dom
 */
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IcsEditableSectionContent } from '@/lib/ics-editable-section'

function renderEditable(
  root: Root,
  props: {
    enabled: boolean
    ariaLabel: string
    onStartEdit: () => void
    childText?: string
  }
) {
  act(() => {
    root.render(
      createElement(
        IcsEditableSectionContent,
        {
          enabled: props.enabled,
          ariaLabel: props.ariaLabel,
          onStartEdit: props.onStartEdit,
        },
        createElement('span', null, props.childText ?? 'Content')
      )
    )
  })
}

describe('IcsEditableSectionContent', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  it('renders a plain div when enabled is false', () => {
    renderEditable(root, {
      enabled: false,
      ariaLabel: 'Edit section',
      onStartEdit: () => {},
      childText: 'Read-only content',
    })

    expect(container.querySelector('[role="button"]')).toBeNull()
    expect(container.textContent).toContain('Read-only content')
  })

  it('calls onStartEdit when clicked while enabled', () => {
    const onStartEdit = vi.fn()

    renderEditable(root, {
      enabled: true,
      ariaLabel: 'Edit section',
      onStartEdit,
    })

    const button = container.querySelector('[role="button"]')
    expect(button).not.toBeNull()
    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(onStartEdit).toHaveBeenCalledTimes(1)
  })

  it('calls onStartEdit on Enter and Space keydown while enabled', () => {
    const onStartEdit = vi.fn()

    renderEditable(root, {
      enabled: true,
      ariaLabel: 'Edit section',
      onStartEdit,
    })

    const button = container.querySelector('[role="button"]')
    expect(button).not.toBeNull()
    act(() => {
      button?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      button?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    })

    expect(onStartEdit).toHaveBeenCalledTimes(2)
  })

  it('does not call onStartEdit when disabled', () => {
    const onStartEdit = vi.fn()

    renderEditable(root, {
      enabled: false,
      ariaLabel: 'Edit section',
      onStartEdit,
    })

    act(() => {
      container.firstElementChild?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(onStartEdit).not.toHaveBeenCalled()
  })
})
