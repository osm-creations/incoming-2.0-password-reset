const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROME_PATH, headless: true, args:['--no-sandbox']});
  const origin = 'http://127.0.0.1:4289';
  const api = 'https://incoming2-0-server.incoming-osmcreations.workers.dev/api/v1/auth/';
  try {
    for (const [w,h] of [[320,568],[430,932],[1280,800]]) {
      const page = await browser.newPage({viewport:{width:w,height:h}});
      let result = {status:200, data:{ok:true}};
      const sent = [];
      await page.route(api + '**', async route => {
        const req=route.request();
        const headers={'access-control-allow-origin':origin,'access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'Content-Type'};
        if(req.method()==='OPTIONS') return route.fulfill({status:204, headers});
        const privateHeaders = await req.allHeaders();
        assert.equal(privateHeaders.referer, undefined);
        assert.equal(privateHeaders.cookie, undefined);
        sent.push({path:new URL(req.url()).pathname, body:req.postDataJSON()});
        return route.fulfill({status:result.status, json:result, headers});
      });
      const overflow = async () => assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), true);
      await page.goto(origin);
      await page.getByRole('heading',{name:'Reset your password'}).waitFor();
      await page.getByLabel('Email address').fill('performer@example.test');
      await overflow();
      await page.getByRole('button',{name:'Send reset link'}).click();
      await page.getByRole('heading',{name:'Check your email'}).waitFor();
      assert.deepEqual(sent[0],{path:'/api/v1/auth/forgot-password',body:{email:'performer@example.test'}});
      await page.getByRole('button',{name:'Request another link'}).click();
      await page.getByRole('heading',{name:'Reset your password'}).waitFor();
      await page.goto(origin + '/#token=sample-setup');
      await page.getByRole('heading',{name:'Set your password'}).waitFor();
      assert.equal(new URL(page.url()).hash, '');
      assert.equal(sent.length, 1);
      await overflow();
      await page.getByLabel('New password',{exact:true}).fill('a demo passphrase for QA');
      await page.getByLabel('Confirm new password').fill('some other passphrase');
      await page.getByRole('button',{name:'Save password'}).click();
      assert.equal(sent.length,1);
      await page.getByLabel('Confirm new password').fill('a demo passphrase for QA');
      await page.getByRole('button',{name:'Save password'}).click();
      await page.getByRole('heading',{name:'Password saved'}).waitFor();
      assert.deepEqual(sent[1],{path:'/api/v1/auth/reset-password',body:{token:'sample-setup',password:'a demo passphrase for QA'}});
      result = {status:400,error:{code:'RESET_LINK_INVALID'}};
      await page.goto(origin+'/?entry=retry#token=expired-sample');
      await page.getByLabel('New password',{exact:true}).fill('a demo passphrase for QA');
      await page.getByLabel('Confirm new password').fill('a demo passphrase for QA');
      await page.getByRole('button',{name:'Save password'}).click();
      await page.getByRole('heading',{name:'Link unavailable'}).waitFor();
      await page.getByRole('button',{name:'Request another link'}).click();
      await page.getByRole('heading',{name:'Reset your password'}).waitFor();
      result = {status:503,error:{code:'UNAVAILABLE'}};
      await page.getByLabel('Email address').fill('performer@example.test');
      await page.getByRole('button',{name:'Send reset link'}).click();
      await page.getByRole('alert').filter({hasText:'try again'}).waitFor();
      await page.close();
      console.log('Browser password request, reset, mismatch, expired link, retry, privacy, and layout passed at', w, 'x', h);
    }
  } finally { await browser.close(); }
})().catch(e=>{console.error(e); process.exitCode=1});
