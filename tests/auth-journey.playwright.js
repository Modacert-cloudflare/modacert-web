globalThis.certificateAuthJourney = async page => {
  const origin = new URL(page.url()).origin;
  const uuid = '123e4567-e89b-42d3-a456-426614174000';
  const auth = { data: { tokens: { accessToken: 'journey-test-token' }, user: { id: 'journey-test', email: 'journey@example.com', fullName: 'Journey Test', role: 'customer' } } };
  let failNext = false;
  let legacyRequests = 0;
  await page.context().route('https://accounts.google.com/gsi/client*', route => route.fulfill({
    contentType: 'application/javascript',
    body: `window.google = { accounts: { id: {
      initialize(config) { this.callback = config.callback; },
      renderButton(element) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Sign in with Google';
        button.onclick = () => this.callback({ credential: 'journey-google-credential' });
        element.append(button);
      }
    } } };`,
  }));
  await page.context().route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/google') legacyRequests++;
    if (path === '/api/v1/auth/google/login' || path === '/api/v1/auth/login') {
      if (path.endsWith('/google/login') && route.request().postDataJSON().idToken !== 'journey-google-credential') throw new Error('Wrong Google credential');
      if (failNext) {
        failNext = false;
        return route.fulfill({ status: 401, json: { message: 'Google sign-in failed.' } });
      }
      return route.fulfill({ json: auth });
    }
    if (path === '/api/v1/brands') return route.fulfill({ json: { data: [] } });
    if (path === '/api/v1/certificates/retrieve') return route.fulfill({ json: { success: true, data: { downloadUrl: 'https://example.com/refined.pdf', originalDownloadUrl: 'https://example.com/reference.pdf' } } });
    throw new Error(`Unexpected API request: ${path}`);
  });

  async function reset(path) {
    await page.goto(origin);
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto(origin + path);
  }
  async function expectCertificate(path) {
    await page.waitForURL(origin + path);
    await page.getByLabel('Certificate ID').waitFor();
    const saved = await page.evaluate(() => ({ token: localStorage.getItem('modacert_token') || sessionStorage.getItem('modacert_token'), path: sessionStorage.getItem('modacert_return_path') }));
    if (saved.token !== 'journey-test-token' || saved.path !== null) throw new Error(JSON.stringify(saved));
  }
  const results = [];
  for (const width of [390, 925, 1440]) {
    await page.setViewportSize({ width, height: 994 });
    await reset('/');
    if (width < 1024) await page.locator('summary').click();
    await page.getByRole('link', { name: 'Get certificate', exact: true }).click();
    await page.waitForURL(origin + '/signin');
    await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click();
    await expectCertificate('/certificate');
    results.push(`Get certificate → Google → certificate at ${width}px`);
  }

  const deepLink = `/certificate?uuid=${uuid}#certificate-uuid`;
  await reset(deepLink);
  await page.waitForURL(origin + '/signin');
  failNext = true;
  await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Google sign-in failed.' }).waitFor();
  if (await page.evaluate(() => sessionStorage.getItem('modacert_return_path')) !== deepLink) throw new Error('Failed login lost the destination');
  await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click();
  await expectCertificate(deepLink);
  if (await page.getByLabel('Certificate ID').inputValue() !== uuid) throw new Error('UUID lost');
  await page.reload();
  await page.getByLabel('Certificate ID').waitFor();
  results.push('Google failure → retry preserves UUID, hash, and session after reload');
  await page.getByRole('button', { name: 'Get certificate' }).click();
  const claim = page.getByRole('link', { name: 'Claim certificate' });
  await claim.waitFor();
  if (await claim.getAttribute('href') !== 'https://example.com/reference.pdf' || await page.getByRole('link', { name: /Version 2|Refined/ }).count()) throw new Error('Wrong certificate action');
  results.push('Certificate lookup shows one claim action for the reference PDF');

  await reset(deepLink);
  await page.waitForURL(origin + '/signin');
  await page.getByRole('link', { name: 'Sign up', exact: true }).click();
  await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click();
  await expectCertificate(deepLink);
  results.push('Switch to sign-up → Google → original certificate');

  await reset(deepLink);
  await page.waitForURL(origin + '/signin');
  await page.getByLabel('Email address').fill('journey@example.com');
  await page.locator('#signin-password').fill('test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expectCertificate(deepLink);
  results.push('Password login → original certificate');

  await reset('/signin');
  await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click();
  await page.waitForURL(origin + '/checkout');
  results.push('Direct sign-in → default checkout');
  if (legacyRequests !== 0) throw new Error('Legacy Google redirect flow used');
  return { passed: results, legacyRequests };
}
