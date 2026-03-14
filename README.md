# Progress Steps Form

A reusable multi-step form component built with HTML, CSS, JavaScript, and Bootstrap.

## What changed

The project is no longer tied to one hard-coded form.

It now works like a reusable component:

- no global element IDs in the JavaScript logic
- each form instance manages its own state
- auto initialization for every `[data-progress-steps]` block
- optional manual initialization with custom callbacks
- simple public methods you can call from any page

## Features

- clickable progress steps
- keyboard navigation
- step-by-step validation
- review screen before submit
- final success state
- reset button to restart the flow
- responsive layout
- reduced motion support
- reusable component API

## Files

- `index.html` demo page
- `style.css` component styling
- `script.js` reusable step logic and validation

## HTML usage

Wrap each form inside a root element with `data-progress-steps`.

```html
<section class="stepper-card" data-progress-steps>
  <!-- component markup -->
</section>
```

## Auto initialization

Every component with `data-progress-steps` is initialized automatically.

```js
window.progressStepsRegistry;
```

## Manual initialization

```js
const card = document.querySelector('[data-progress-steps]');

const formFlow = new ProgressStepsForm(card, {
  onStepChange: ({ step, data }) => {
    console.log('Current step:', step, data);
  },
  onSubmit: ({ data }) => {
    console.log('Submitted data:', data);
  },
  onReset: () => {
    console.log('Form reset');
  },
});
```

## Public methods

```js
formFlow.goToStep(2);
formFlow.next();
formFlow.previous();
formFlow.reset();
formFlow.getFormData();
```

## Notes

If you want more than one form on the same page, duplicate the markup and keep the same `data-role` attributes inside each component root. The script scopes everything to the current root element.
# progress-steps-new
