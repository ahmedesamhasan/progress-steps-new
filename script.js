class ProgressStepsForm {
  constructor(rootElement, options = {}) {
    this.root = rootElement;
    this.options = options;
    this.currentStep = 1;

    this.elements = this.getElements();
    this.stepMessages = {
      1: 'Start with the basic account details, then move to the next step.',
      2: 'Fill in your profile details and accept the terms to continue.',
      3: 'Review all details carefully, then submit the form.',
      4: 'The form was submitted successfully. You can reset the flow and try again.',
      ...(options.stepMessages || {}),
    };

    this.reviewFields = options.reviewFields || [
      { label: 'Full name', key: 'fullName' },
      { label: 'Email address', key: 'email' },
      { label: 'Job title', key: 'jobTitle' },
      { label: 'Country', key: 'country' },
      { label: 'Short bio', key: 'bio' },
      { label: 'Terms accepted', key: 'terms' },
    ];

    this.attachEvents();
    this.updateStepper();
  }

  getElements() {
    return {
      progressBar: this.root.querySelector('[data-role="progress-bar"]'),
      progressTrack: this.root.querySelector('[data-role="progress-track"]'),
      prevButton: this.root.querySelector('[data-role="prev-button"]'),
      nextButton: this.root.querySelector('[data-role="next-button"]'),
      resetButton: this.root.querySelector('[data-role="reset-button"]'),
      submitButton: this.root.querySelector('[data-role="submit-button"]'),
      stepText: this.root.querySelector('[data-role="step-text"]'),
      stepPercent: this.root.querySelector('[data-role="step-percent"]'),
      stepNote: this.root.querySelector('[data-role="step-note"]'),
      form: this.root.querySelector('[data-role="form"]'),
      reviewGrid: this.root.querySelector('[data-role="review-grid"]'),
      termsError: this.root.querySelector('[data-role="terms-error"]'),
      doneName: this.root.querySelector('[data-role="done-name"]'),
      doneEmail: this.root.querySelector('[data-role="done-email"]'),
      doneJob: this.root.querySelector('[data-role="done-job"]'),
      doneCountry: this.root.querySelector('[data-role="done-country"]'),
      stepButtons: Array.from(this.root.querySelectorAll('[data-role="step-button"]')),
      stepPanels: Array.from(this.root.querySelectorAll('[data-role="step-panel"]')),
    };
  }

  attachEvents() {
    const { prevButton, nextButton, resetButton, submitButton, stepButtons, form } = this.elements;

    nextButton.addEventListener('click', () => this.next());
    prevButton.addEventListener('click', () => this.previous());
    submitButton.addEventListener('click', () => this.submit());
    resetButton.addEventListener('click', () => this.reset());

    stepButtons.forEach((button) => {
      button.addEventListener('click', () => this.handleStepButtonClick(button));
      button.addEventListener('keydown', (event) => this.handleStepKeyboard(event, button));
    });

    form.addEventListener('input', (event) => this.handleInput(event));
  }

  handleStepButtonClick(button) {
    const targetStep = Number(button.dataset.step);

    if (targetStep > this.currentStep && !this.canMoveForwardTo(targetStep)) {
      return;
    }

    if (targetStep === 3) {
      this.renderReview();
    }

    if (targetStep === 4) {
      this.fillDoneSummary();
    }

    this.goToStep(targetStep, true);
  }

  handleStepKeyboard(event, button) {
    const stepNumber = Number(button.dataset.step);
    const lastStep = this.elements.stepButtons.length;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusStep(Math.min(stepNumber + 1, lastStep));
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusStep(Math.max(stepNumber - 1, 1));
    }

    if (event.key === 'Home') {
      event.preventDefault();
      this.focusStep(1);
    }

    if (event.key === 'End') {
      event.preventDefault();
      this.focusStep(lastStep);
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      button.click();
    }
  }

  handleInput(event) {
    const field = event.target;

    if (field.matches('.form-control, .form-select')) {
      field.classList.remove('is-invalid');
    }

    if (field.name === 'terms') {
      this.toggleTermsError(false);
    }
  }

  next() {
    if (!this.validateCurrentStep()) {
      return;
    }

    if (this.currentStep === 2) {
      this.renderReview();
    }

    this.goToStep(this.currentStep + 1, true);
  }

  previous() {
    this.goToStep(this.currentStep - 1, true);
  }

  submit() {
    if (!this.validateCurrentStep()) {
      return;
    }

    this.fillDoneSummary();
    this.goToStep(4, true);

    this.runCallback('onSubmit', {
      step: this.currentStep,
      data: this.getFormData(),
      instance: this,
    });
  }

  reset() {
    this.elements.form.reset();
    this.clearValidation();
    this.elements.reviewGrid.innerHTML = '';
    this.goToStep(1, true);

    this.runCallback('onReset', {
      step: this.currentStep,
      data: this.getFormData(),
      instance: this,
    });
  }

  goToStep(stepNumber, moveFocusToStep = false) {
    const totalSteps = this.elements.stepButtons.length;

    if (stepNumber < 1 || stepNumber > totalSteps) {
      return;
    }

    this.currentStep = stepNumber;
    this.updateStepper();

    if (moveFocusToStep) {
      this.focusStep(stepNumber);
    }

    this.runCallback('onStepChange', {
      step: this.currentStep,
      data: this.getFormData(),
      instance: this,
    });
  }

  focusStep(stepNumber) {
    const button = this.root.querySelector(`[data-role="step-button"][data-step="${stepNumber}"]`);

    if (button) {
      button.focus();
    }
  }

  updateStepper() {
    const { stepButtons, stepPanels, progressBar, progressTrack, stepText, stepPercent, stepNote, prevButton, nextButton, submitButton } = this.elements;
    const totalSteps = stepButtons.length;

    stepButtons.forEach((button, index) => {
      const stepNumber = index + 1;
      const isCompleted = stepNumber < this.currentStep;
      const isCurrent = stepNumber === this.currentStep;

      button.classList.toggle('is-complete', isCompleted);
      button.classList.toggle('is-active', isCurrent);
      button.setAttribute('aria-selected', String(isCurrent));
      button.tabIndex = isCurrent ? 0 : -1;
    });

    stepPanels.forEach((panel, index) => {
      const isCurrent = index + 1 === this.currentStep;
      panel.hidden = !isCurrent;
      panel.classList.toggle('is-visible', isCurrent);
    });

    const progressPercent = ((this.currentStep - 1) / (totalSteps - 1)) * 100;
    progressBar.style.width = `${progressPercent}%`;
    progressTrack.setAttribute('aria-valuenow', String(Math.round(progressPercent)));
    stepText.textContent = `Step ${this.currentStep} of ${totalSteps}`;
    stepPercent.textContent = `${Math.round(progressPercent)}% complete`;
    stepNote.textContent = this.stepMessages[this.currentStep] || '';

    prevButton.disabled = this.currentStep === 1;
    nextButton.disabled = this.currentStep >= totalSteps - 1;
    nextButton.classList.toggle('d-none', this.currentStep >= totalSteps - 1);
    submitButton.classList.toggle('d-none', this.currentStep !== totalSteps - 1);
  }

  validateCurrentStep() {
    if (this.currentStep === 1) {
      return this.validateStepOne();
    }

    if (this.currentStep === 2) {
      return this.validateStepTwo();
    }

    return true;
  }

  validateStepOne() {
    const fullName = this.getField('fullName');
    const email = this.getField('email');
    const password = this.getField('password');
    const confirmPassword = this.getField('confirmPassword');

    let isValid = true;

    [fullName, email, password, confirmPassword].forEach((field) => {
      if (!field.checkValidity()) {
        field.classList.add('is-invalid');
        isValid = false;
      }
    });

    if (password.value.trim() && confirmPassword.value.trim() && password.value !== confirmPassword.value) {
      confirmPassword.classList.add('is-invalid');
      isValid = false;
    }

    return isValid;
  }

  validateStepTwo() {
    const jobTitle = this.getField('jobTitle');
    const country = this.getField('country');
    const bio = this.getField('bio');
    const terms = this.getField('terms');

    let isValid = true;

    [jobTitle, country, bio].forEach((field) => {
      if (!field.checkValidity()) {
        field.classList.add('is-invalid');
        isValid = false;
      }
    });

    if (!terms.checked) {
      this.toggleTermsError(true);
      isValid = false;
    } else {
      this.toggleTermsError(false);
    }

    return isValid;
  }

  toggleTermsError(showError) {
    if (!this.elements.termsError) {
      return;
    }

    this.elements.termsError.classList.toggle('visually-hidden', !showError);
  }

  renderReview() {
    const formData = this.getFormData();

    this.elements.reviewGrid.innerHTML = this.reviewFields
      .map((field) => {
        const value = this.formatReviewValue(field.key, formData[field.key]);

        return `
          <div class="review-item">
            <span class="review-label">${field.label}</span>
            <strong class="review-value">${this.escapeHtml(value)}</strong>
          </div>
        `;
      })
      .join('');
  }

  fillDoneSummary() {
    const formData = this.getFormData();

    this.elements.doneName.textContent = formData.fullName || '-';
    this.elements.doneEmail.textContent = formData.email || '-';
    this.elements.doneJob.textContent = formData.jobTitle || '-';
    this.elements.doneCountry.textContent = formData.country || '-';
  }

  getFormData() {
    return {
      fullName: this.getFieldValue('fullName').trim(),
      email: this.getFieldValue('email').trim(),
      password: this.getFieldValue('password'),
      confirmPassword: this.getFieldValue('confirmPassword'),
      jobTitle: this.getFieldValue('jobTitle').trim(),
      country: this.getFieldValue('country'),
      bio: this.getFieldValue('bio').trim(),
      terms: this.getField('terms').checked,
    };
  }

  getField(name) {
    return this.elements.form.elements[name];
  }

  getFieldValue(name) {
    const field = this.getField(name);
    return field ? field.value : '';
  }

  canMoveForwardTo(targetStep) {
    if (targetStep <= this.currentStep) {
      return true;
    }

    if (targetStep === 2) {
      return this.validateStepOne();
    }

    if (targetStep === 3) {
      return this.validateStepOne() && this.validateStepTwo();
    }

    if (targetStep === 4) {
      const isValid = this.validateStepOne() && this.validateStepTwo();

      if (isValid) {
        this.renderReview();
        this.fillDoneSummary();
      }

      return isValid;
    }

    return true;
  }

  formatReviewValue(key, value) {
    if (key === 'terms') {
      return value ? 'Yes' : 'No';
    }

    if (key === 'password' || key === 'confirmPassword') {
      return '••••••••';
    }

    return value || '-';
  }

  clearValidation() {
    const invalidFields = this.elements.form.querySelectorAll('.is-invalid');
    invalidFields.forEach((field) => field.classList.remove('is-invalid'));
    this.toggleTermsError(false);
  }

  escapeHtml(value) {
    const htmlMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return String(value).replace(/[&<>"']/g, (char) => htmlMap[char]);
  }

  runCallback(callbackName, payload) {
    const callback = this.options[callbackName];

    if (typeof callback === 'function') {
      callback(payload);
    }
  }
}

function createProgressSteps(rootElement, options = {}) {
  return new ProgressStepsForm(rootElement, options);
}

const progressStepsRegistry = Array.from(document.querySelectorAll('[data-progress-steps]')).map((rootElement) => {
  const instance = createProgressSteps(rootElement, {
    onSubmit: ({ data }) => {
      console.log('Progress form submitted:', data);
    },
  });

  const instanceName = rootElement.dataset.instanceName;

  if (instanceName) {
    window[instanceName] = instance;
  }

  return instance;
});

window.ProgressStepsForm = ProgressStepsForm;
window.createProgressSteps = createProgressSteps;
window.progressStepsRegistry = progressStepsRegistry;
