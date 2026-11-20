const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args:['--no-sandbox'], headless:true });
  try {
    const page=await browser.newPage();
    const sent=[];
    let delivered=true;
    await page.route('**/api/v1/**', async route=>{
      const req=route.request(), path=new URL(req.url()).pathname;
      const headers={'access-control-allow-origin':'http://127.0.0.1:4290','access-control-allow-credentials':'true','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,x-csrf-token'};
      if(req.method()==='OPTIONS') return route.fulfill({status:204,headers});
      let data;
      if(path.endsWith('/me')) data={user:{id:'admin',role:'ADMIN',publicUserId:'admin',email:'admin@example.test'}};
      else if(path.endsWith('/csrf')) data={csrfToken:'a-csrf-token-for-fixture'};
      else if(path.endsWith('/users') && req.method()==='POST') {sent.push(req.postDataJSON());data={publicUserId:'magician',email:'demo@example.test',welcomeEmailSent:delivered};}
      else if(path.endsWith('/users')) data={users:[]};
      else throw Error(path);
      return route.fulfill({headers,json:{data}});
    });
    await page.goto('http://127.0.0.1:4290/users');
    for(const success of [true,false]) {
      delivered=success;
      await page.getByRole('button',{name:'Create user',exact:true}).click();
      await page.getByLabel('Email',{exact:true}).fill('demo@example.test');
      if(!success) await page.getByLabel('Temporary password (optional)',{exact:false}).fill('My-temp-pass-1234');
      await page.getByRole('button',{name:'Create',exact:true}).click();
      await page.getByRole('status').filter({hasText:success?'Welcome email sent':'delivery was not confirmed'}).waitFor();
    }
    assert.deepEqual(sent[0],{email:'demo@example.test',role:'MAGICIAN'});
    assert.equal(sent[1].password,'My-temp-pass-1234');console.log('Admin generated/manual temporary password forms, success & non-delivery, passed');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
