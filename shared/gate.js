/* Soft password gate for the whole site.

   "Soft" on purpose: it hides the page behind a password screen, but the
   content still ships in the HTML, so anyone who reads the source can see
   it. It keeps casual visitors and search snippets out, nothing more. The
   Slack case study is the exception — that page is properly encrypted at
   build time (build.sh) and carries its own lock, so it does not load this.

   Loaded synchronously in each page's <head> so the page never flashes
   before the gate. A correct password is remembered on the device
   (localStorage), and case studies inside the homepage overlay share that
   storage, so they open without asking again.

   Only a SHA-256 of the password is kept here, so it is not readable in the
   source at a glance. To change it, replace HASH with the SHA-256 (hex) of
   the new password. */
(() => {
  const HASH = '0e6a8e0b849ed9b064c5a25e1ee5592f427e3eb9d250e42069ce46147d00e8d4';
  const KEY = 'pf-gate';

  let stored = null;
  try { stored = localStorage.getItem(KEY); } catch (_) {}
  if (stored === HASH) return;

  const root = document.documentElement;
  root.classList.add('pf-locked');

  // Same card as the Slack case study's lock (.staticrypt-slack.html,
  // .cs-wall): the page shows through, blurred, with the card over it.
  const css = document.createElement('style');
  css.textContent = `
    html.pf-locked body > :not(.pf-gate) {
      filter: blur(8px);
      pointer-events: none;
      user-select: none;
      -webkit-user-select: none;
    }
    html.pf-locked, html.pf-locked body { overflow: hidden !important; }
    .pf-gate {
      position: fixed; inset: 0; z-index: 2147483647;
      display: grid; place-items: center; padding: 24px;
      background: rgba(251, 250, 248, .35);
      overflow-y: auto;
    }
    .pf-gate__card {
      box-sizing: border-box;
      display: flex; flex-direction: column; align-items: center; gap: 40px;
      width: min(100%, 640px);
      padding: clamp(40px, 7vw, 100px);
      border: 1px solid rgba(94, 93, 96, .13);
      border-radius: 32px;
      background: #fff;
      box-shadow: 0 18px 24px rgba(0, 0, 0, .1);
    }
    .pf-gate__mark { width: 74px; height: 74px; }
    .pf-gate__text { display: flex; flex-direction: column; gap: 12px; text-align: center; }
    .pf-gate__title {
      margin: 0;
      font: 800 28px/1.15 'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif;
      color: #1c1917;
    }
    .pf-gate__body {
      margin: 0;
      font: 500 16px/1.6 'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif;
      color: #5e5d60;
    }
    .pf-gate__form { display: flex; flex-direction: column; gap: 16px; width: min(100%, 254px); }
    .pf-gate__input {
      box-sizing: border-box; width: 100%; min-height: 44px; padding: 10px 16px;
      border: 1px solid #77757a; border-radius: 8px; background: #fff;
      font: 16px Geist, 'Helvetica Neue', Arial, sans-serif;
      text-align: center; color: #454447;
    }
    .pf-gate__input::placeholder { color: #77757a; }
    .pf-gate__input:focus-visible,
    .pf-gate__btn:focus-visible { outline: 2px solid #00B5E1; outline-offset: 2px; }
    .pf-gate__btn {
      width: 100%; padding: 8.33px 13.33px; border: 0; border-radius: 10px;
      background: #1d1c1d; color: #fff;
      font: 600 13.33px Geist, 'Helvetica Neue', Arial, sans-serif;
      cursor: pointer;
    }
    .pf-gate__err {
      margin: 0; min-height: 1em; text-align: center; color: #00B5E1;
      font: 13.33px Geist, 'Helvetica Neue', Arial, sans-serif;
    }
  `;
  document.head.appendChild(css);

  // the avatar lives at the site root; case studies are one folder down
  const base = new URL('..', document.currentScript ? document.currentScript.src : location.href);

  const sha256 = async (text) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const mount = () => {
    const gate = document.createElement('div');
    gate.className = 'pf-gate';
    gate.innerHTML = `
      <div class="pf-gate__card" role="dialog" aria-modal="true" aria-labelledby="pf-gate-title">
        <img class="pf-gate__mark" src="${new URL('assets/logos/avatar.svg', base).href}" alt="" aria-hidden="true" width="74" height="74">
        <div class="pf-gate__text">
          <p class="pf-gate__title" id="pf-gate-title">Want to see my work?</p>
          <p class="pf-gate__body">This portfolio is password protected &mdash; enter the password, or reach out to request access.</p>
        </div>
        <form class="pf-gate__form">
          <input class="pf-gate__input" type="password" name="pw" placeholder="Password" aria-label="Password" aria-describedby="pf-gate-err" autocomplete="current-password" required>
          <button class="pf-gate__btn" type="submit">See portfolio</button>
          <p class="pf-gate__err" id="pf-gate-err" role="status" aria-live="polite"></p>
        </form>
      </div>`;
    document.body.appendChild(gate);
    const form = gate.querySelector('form');
    const input = form.querySelector('input');
    const err = form.querySelector('.pf-gate__err');
    input.focus();
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (await sha256(input.value) === HASH) {
        try { localStorage.setItem(KEY, HASH); } catch (_) {}
        gate.remove();
        root.classList.remove('pf-locked');
      } else {
        err.textContent = 'Wrong password';
        input.select();
      }
    });
  };

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
