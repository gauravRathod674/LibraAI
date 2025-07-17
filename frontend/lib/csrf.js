// frontend/lib/csrf.js
export function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
      const [key, value] = cookies[i].split("=");
      if (key === name) {
        cookieValue = decodeURIComponent(value);
        break;
      }
    }
  }
  return cookieValue;
}
