// src/utils/loaderEvent.js

// Simple event target to manage global loading state
const loaderEvent = new EventTarget();

export const showLoader = () => {
  loaderEvent.dispatchEvent(new Event('show'));
};

export const hideLoader = () => {
  loaderEvent.dispatchEvent(new Event('hide'));
};

export default loaderEvent;