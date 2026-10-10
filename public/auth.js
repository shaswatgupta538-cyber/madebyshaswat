function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { return null; }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

function renderNav(elId) {
  const el = document.getElementById(elId);
  const user = getUser();
  if (!user) {
    el.innerHTML = `<a href="/login.html">Log in</a><a class="btn" href="/signup.html">Sign up</a>`;
    return;
  }
  let links = `<a href="/account.html">My Orders</a>`;
  if (user.isAdmin) links += `<a href="/admin.html">Dashboard</a>`;
  links += `<a href="#" onclick="logout()">Log out</a>`;
  el.innerHTML = links;
}
