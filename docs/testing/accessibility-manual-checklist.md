# Manual accessibility review checklist

## Purpose and scope

Use this checklist to supplement the automated Playwright and axe-core checks. It covers the current starter page, especially the greeting form and its validation, success, and request-error states.

This document is a test procedure, not evidence that a manual review has passed. Completing it for one browser and assistive-technology combination does not establish WCAG conformance for every browser, device, or user need.

Run the automated baseline first:

```bash
bun run test:e2e
```

## Record the test environment

Record one review per browser and assistive-technology combination.

- Date:
- Reviewer:
- Commit SHA:
- Operating system and version:
- Browser and version:
- Screen reader and version, or "not used":
- Viewport size and browser zoom:
- Result: Pass / Fail / Blocked
- Related issue or evidence:

## Keyboard-only review

Use the keyboard for the entire check. Do not use a mouse or touch input.

- [ ] Reload the page and press Tab. The first focused control is the visible-on-focus "Skip to content" link; activate it and verify it moves the viewport to the main content.
- [ ] Continue with Tab and Shift+Tab through the brand link, desktop navigation (or the mobile menu button at narrow widths), primary calls to action, and the rest of the page. Focus order remains logical and no keyboard trap occurs.
- [ ] Open the mobile navigation with the keyboard. Verify its expanded state is announced, all links can be reached, and selecting a link closes the menu and moves to the intended section.
- [ ] The focused links, buttons, form field, and menu controls have a clearly visible focus indicator against their surrounding backgrounds.
- [ ] Submit the empty form using the keyboard. The validation message appears, the field is exposed as invalid, and focus remains visible and usable.
- [ ] In the API playground, focus the "Your name" field, enter a valid name, and submit with Enter. The request completes without a pointer.
- [ ] Confirm the validation message is associated with the text field and can be reached or heard without relying on its color.
- [ ] Enter a name and submit with Enter. The form can be completed without a pointer.
- [ ] Repeat submission using Space or Enter while the submit button is focused.
- [ ] Confirm the success message is perceivable and keyboard focus does not jump to an unexpected location.
- [ ] After a validation error, edit the field. The stale validation message and invalid state clear.
- [ ] Cause the greeting request to fail in the browser (for example, temporarily block the `/api/greet` request). Confirm the error is visible and keyboard focus remains usable.
- [ ] Continue tabbing after each feedback state. Focus is not lost, obscured, or trapped.

## Screen-reader review

Use at least one screen reader/browser pair relevant to the intended audience. Suggested reference combinations are NVDA with Firefox or Chrome on Windows, and VoiceOver with Safari on macOS. Record the exact versions in the environment section.

- [ ] The page exposes a meaningful document title, a main landmark, and a logical heading hierarchy (page heading followed by the greeting section heading).
- [ ] The greeting section has an understandable name.
- [ ] The text field is announced with the label "Your name" and as an editable text control.
- [ ] The submit control is announced with the name "Say hello" and as a button. The decorative send icon is not announced as a separate control.
- [ ] Submit the empty form. The validation message is announced, and the field's invalid state and associated error description are available when navigating back to it.
- [ ] Submit a valid name. The success result is announced without requiring focus to move to the message.
- [ ] Trigger an API failure. The error is announced without requiring focus to move to the message.
- [ ] During a throttled request, verify the busy/disabled state and changing button label are understandable.
- [ ] No information is communicated only by color, position, or visual styling.

Do not treat a message being visible on screen as proof that it is announced by assistive technology. Verify the spoken or braille output and record any inconsistent announcement behavior.

## Visual, zoom, and motion review

- [ ] At 200% text resize, content and functionality remain available without clipping or overlap.
- [ ] At a viewport equivalent to 320 CSS pixels wide (for example, a 1280 CSS-pixel starting viewport at 400% browser zoom), the page can be used without horizontal scrolling for ordinary content.
- [ ] The form field, button, validation feedback, success message, and request error remain visible and usable at narrow widths.
- [ ] Text contrast is at least 4.5:1 for normal text and 3:1 for large text. Check the actual foreground/background pairs, including muted and feedback text.
- [ ] Focus indicators and meaningful control boundaries remain distinguishable against adjacent colors.
- [ ] With the operating system's reduced-motion preference enabled, non-essential transitions and animations are reduced or removed.
- [ ] At browser zoom and narrow viewport sizes, focused controls are not entirely hidden by author-created content.

## Review outcome

Record the result as Pass, Fail, or Blocked for each environment. For every failure, include the affected state, reproduction steps, browser/assistive-technology versions, and (when appropriate) a screenshot, recording, or screen-reader transcript. Link the issue and retest it after the fix.

A checklist with unchecked items is not a pass. Keep manual results separate from GitHub Actions results: axe-core and automated keyboard tests are useful regression checks, but they do not prove manual keyboard or screen-reader usability or full WCAG conformance.

## References

- [WCAG 2.2 — W3C Recommendation](https://www.w3.org/TR/WCAG22/)
- [Understanding WCAG 2.2 Success Criterion 4.1.3: Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
