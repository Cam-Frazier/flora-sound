// Placeholder for future scripts

console.log('Flora Sound System loaded');

const modal = document.getElementById('contactModal');
const trigger = document.querySelector('.contact-trigger');
const closeButtons = document.querySelectorAll('[data-close-modal]');

trigger.addEventListener('click', () => {
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
});

closeButtons.forEach(button => {
  button.addEventListener('click', () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }
});
