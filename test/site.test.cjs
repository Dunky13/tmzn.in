const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM, requestInterceptor, VirtualConsole } = require('jsdom');

const output = path.resolve('docs');
const resources = {
  interceptors: [requestInterceptor(async request => {
    const parsed = new URL(request.url);
    // External presentation and analytics resources are not part of this test.
    const type = parsed.pathname.endsWith('.css') ? 'text/css' : 'application/javascript';
    if (parsed.origin !== 'https://tmzn.test') {
      return new Response('', { headers: { 'Content-Type': type } });
    }
    const file = path.join(output, decodeURIComponent(parsed.pathname));
    assert.ok(file.startsWith(`${output}${path.sep}`));
    assert.ok(existsSync(file), `Missing generated resource ${parsed.pathname}`);
    return new Response(readFileSync(file), { headers: { 'Content-Type': type } });
  })],
};

async function open(hash) {
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(readFileSync(path.join(output, 'index.html'), 'utf8'), {
    url: `https://tmzn.test/${hash}`,
    runScripts: 'dangerously',
    resources,
    virtualConsole: console,
    pretendToBeVisual: true,
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Site did not initialize')), 5000);
    dom.window.addEventListener('load', () => {
      dom.window.jQuery(() => {
        clearTimeout(timeout);
        resolve();
      });
    });
  });
  assert.deepEqual(errors, []);
  return dom;
}

function change(window, selector, value) {
  const element = window.document.querySelector(selector);
  element.value = value;
  element.dispatchEvent(new window.Event('change', { bubbles: true }));
}

test('shared timezone link and New Date preserve the conversion flow', async () => {
  const dom = await open('#2026-10-24T12:00%20America/New_York');
  const { window } = dom;
  try {
    const document = window.document;
    assert.equal(document.querySelector('#originalTime').value, '2026-10-24T12:00');
    assert.equal(document.querySelector('#group').value, 'America');
    assert.equal(document.querySelector('#zone').value, 'America/New_York');
    for (const selector of ['#originalTime', '#group', '#zone']) {
      assert.equal(document.querySelector(selector).disabled, true);
    }
    const before = document.querySelector('#yourTime').textContent;
    assert.equal(before, 'Oct 24, 2026, 4:00 PM UTC');
    assert.ok(!before.includes('Invalid'));
    document.querySelector('#newDate').click();
    for (const selector of ['#originalTime', '#group', '#zone']) {
      assert.equal(document.querySelector(selector).disabled, false);
    }
    change(window, '#group', 'Asia');
    change(window, '#zone', 'Asia/Tokyo');
    change(window, '#originalTime', '2026-10-24T12:00');
    assert.equal(window.location.hash, '#2026-10-24T12:00%20Asia/Tokyo');
    assert.equal(document.querySelector('#yourTime').textContent, 'Oct 24, 2026, 3:00 AM UTC');
    assert.ok(!document.querySelector('#yourTime').textContent.includes('Invalid'));
  } finally {
    window.close();
  }
});

test('unshared and invalid links remain editable', async () => {
  for (const hash of ['', '#invalid']) {
    const dom = await open(hash);
    try {
      for (const selector of ['#originalTime', '#group', '#zone']) {
        assert.equal(dom.window.document.querySelector(selector).disabled, false);
      }
      assert.ok(!dom.window.document.querySelector('#yourTime').textContent.includes('Invalid'));
    } finally {
      dom.window.close();
    }
  }
});

test('generated routes, local asset references and manifest remain complete', () => {
  for (const route of ['index.html', '404.html']) {
    const dom = new JSDOM(readFileSync(path.join(output, route), 'utf8'), {
      url: 'https://tmzn.test/',
    });
    try {
      for (const element of dom.window.document.querySelectorAll('script[src], link[href], img[src]')) {
        const url = new URL(element.src || element.href);
        if (url.origin === 'https://tmzn.test') {
          assert.ok(existsSync(path.join(output, url.pathname)), `Missing ${url.pathname}`);
        }
      }
    } finally {
      dom.window.close();
    }
  }
  assert.ok(existsSync(path.join(output, 'images/favicons/manifest.json')));
  assert.match(readFileSync(path.join(output, 'sitemap.xml'), 'utf8'), /https:\/\/tmzn\.in\/index\.html/);
  assert.match(readFileSync(path.join(output, 'robots.txt'), 'utf8'), /https:\/\/tmzn\.in\/sitemap\.xml/);
});
