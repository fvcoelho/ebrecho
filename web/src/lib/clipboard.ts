/**
 * Utility function to copy text to clipboard with fallback support
 * Works in both HTTPS and HTTP contexts
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Check if modern clipboard API is available (requires HTTPS)
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers or HTTP contexts
      return copyToClipboardFallback(text)
    }
  } catch (err) {
    // Try fallback method as last resort
    return copyToClipboardFallback(text)
  }
}

/**
 * Fallback method using document.execCommand (deprecated but widely supported)
 */
function copyToClipboardFallback(text: string): boolean {
  try {
    // First try to use an existing textarea with the PIX payload (even if hidden)
    const existingTextareas = document.querySelectorAll('textarea')
    let targetTextarea: HTMLTextAreaElement | null = null
    
    // Find a textarea that contains our text (PIX payload)
    for (const textarea of Array.from(existingTextareas)) {
      if (textarea instanceof HTMLTextAreaElement && textarea.value === text) {
        targetTextarea = textarea
        break
      }
    }
    
    if (targetTextarea) {
      // Temporarily make it selectable if it's hidden
      const originalTabIndex = targetTextarea.tabIndex
      const originalAriaHidden = targetTextarea.getAttribute('aria-hidden')
      
      targetTextarea.tabIndex = 0
      targetTextarea.removeAttribute('aria-hidden')
      
      // Use the existing textarea
      targetTextarea.select()
      targetTextarea.setSelectionRange(0, text.length)
      targetTextarea.focus()
      
      const successful = document.execCommand('copy')
      
      // Restore original attributes
      targetTextarea.tabIndex = originalTabIndex
      if (originalAriaHidden) {
        targetTextarea.setAttribute('aria-hidden', originalAriaHidden)
      }
      
      if (successful) {
        return true
      }
    }
    
    // If no existing textarea or copy failed, create a temporary one
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    textArea.style.opacity = '0'
    textArea.style.zIndex = '-1'
    textArea.readOnly = false
    textArea.contentEditable = 'true'
    
    document.body.appendChild(textArea)
    
    // Better selection approach
    if (textArea.select) {
      textArea.select()
    }
    textArea.setSelectionRange(0, text.length)
    
    // Ensure focus
    textArea.focus()
    
    const successful = document.execCommand('copy')
    
    document.body.removeChild(textArea)
    
    return successful
  } catch (err) {
    // Try alternative fallback method
    return copyToClipboardAlternative(text)
  }
}

/**
 * Alternative fallback using range selection (for edge cases)
 */
function copyToClipboardAlternative(text: string): boolean {
  try {
    const span = document.createElement('span')
    span.textContent = text
    span.style.position = 'fixed'
    span.style.left = '-999999px'
    span.style.top = '-999999px'
    span.style.opacity = '0'
    span.style.whiteSpace = 'pre'
    
    document.body.appendChild(span)
    
    const selection = window.getSelection()
    if (selection) {
      const range = document.createRange()
      range.selectNodeContents(span)
      selection.removeAllRanges()
      selection.addRange(range)
      
      const successful = document.execCommand('copy')
      
      selection.removeAllRanges()
      document.body.removeChild(span)
      
      return successful
    }
    
    document.body.removeChild(span)
    return false
  } catch (err) {
    return false
  }
}

/**
 * Check if clipboard functionality is available
 */
export function isClipboardSupported(): boolean {
  return !!(navigator?.clipboard?.writeText || document?.execCommand)
}