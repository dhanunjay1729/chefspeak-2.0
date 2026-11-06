import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

// Render the real Dashboard with controlled account/profile/Firestore responses.
// Recommendations still use the real HTTP service, intercepted at the network boundary.
const root = fileURLToPath(new URL('../../', import.meta.url));
const stubId = '/@dashboard-fixture';
const stubs = `
import React, { useContext } from 'react';
export const FixtureContext = React.createContext(null);
export const useAuth = () => useContext(FixtureContext);
export const useUserProfile = () => useContext(FixtureContext).profile;
export const getRecentDishes = uid => window.dashboardFixture.request('recent', uid);
export const getFavoriteDishes = uid => window.dashboardFixture.request('favorites', uid);
export const deleteRecentDish = async () => {};
export default function Header() { return null; }
`;
const html = `<!doctype html><html><body><div id="root"></div><script type="module">
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '/src/pages/Dashboard.jsx';
import { FixtureContext } from '${stubId}';
import '/src/index.css';
const empty = [];
window.dashboardFixture = {
  requests: [],
  request(kind, uid) {
    return new Promise((resolve, reject) => this.requests.push({kind, uid, resolve, reject, settled:false}));
  },
  finish(kind, uid, value, fail=false) {
    const request = this.requests.find(r => r.kind === kind && r.uid === uid && !r.settled);
    if (!request) throw new Error('Missing fixture request: ' + kind + '/' + uid);
    request.settled = true;
    fail ? request.reject(new Error('Fixture unavailable')) : request.resolve(value);
  },
};
function Fixture() {
  const [user, setUser] = useState({uid:'alice', displayName:'Alice'});
  const [profileLoading, setProfileLoading] = useState(new URLSearchParams(location.search).has('slowProfile'));
  window.setDashboardUser = uid => setUser(uid ? {uid, displayName:uid} : null);
  window.setDashboardProfileLoading = setProfileLoading;
  useEffect(() => { window.fixtureReady = true; }, []);
  const profile = {displayName:user?.displayName, dietType:'veg', allergies:empty, dislikes:empty,
    preferredLanguage:'indian_english', loading:profileLoading};
  return React.createElement(FixtureContext.Provider, {value:{user,currentUser:user,profile}},
    React.createElement(MemoryRouter, null, React.createElement(Dashboard)));
}
createRoot(document.getElementById('root')).render(React.createElement(Fixture));
</script></body></html>`;
const vite = await createServer({
  root, configFile:false, envFile:false, esbuild:{jsx:'automatic'},
  resolve:{alias:{'@':`${root}src`}},
  server:{host:'127.0.0.1', port:0, hmr:false, watch:null},
  plugins:[{
    name:'dashboard-fixture', enforce:'pre',
    resolveId(id) { if (id === stubId) return id; },
    load(id) { if (id === stubId) return stubs; },
    transform(code, id) {
      if (id.endsWith('/src/pages/Dashboard.jsx')) {
        return code.replace(/(['"])\.\.\/(contexts\/AuthContext|hooks\/useUserProfile|services\/userService|components\/Header)\1/g, JSON.stringify(stubId));
      }
      if (id.endsWith('/src/config/api.js')) return "export const apiBaseUrl = '';";
    },
    configureServer(server) {
      server.middlewares.use('/__dashboard-check', async (_req, res) => {
        res.setHeader('Content-Type','text/html');
        res.end(await server.transformIndexHtml('/__dashboard-check', html));
      });
    },
  }],
});
let browser;
const pageErrors = [];
try {
  await vite.listen();
  browser = await chromium.launch({headless:true,args:['--no-sandbox']});
  const url = `http://127.0.0.1:${vite.httpServer.address().port}/__dashboard-check`;
  const open = async (query='') => {
    const page = await browser.newPage({viewport:{width:390,height:844}});
    page.setDefaultTimeout(5000);
    const recommendations = [];
    page.on('pageerror', e => pageErrors.push(e.message));
    await page.route('**/api/recipe/recommend', route => { recommendations.push(route); });
    await page.goto(url + query);
    await page.waitForFunction(() => window.fixtureReady);
    await page.getByRole('button',{name:/Start Cooking/}).waitFor({state:'visible',timeout:2000});
    return {page,recommendations};
  };
  const waitRequest = (page, kind, uid) => page.waitForFunction(({kind,uid}) =>
    window.dashboardFixture.requests.some(r => r.kind === kind && r.uid === uid), {kind,uid});
  const finish = (page, kind, uid, value, fail=false) => page.evaluate(({kind,uid,value,fail}) =>
    window.dashboardFixture.finish(kind,uid,value,fail), {kind,uid,value,fail});
  const waitRecommendation = async (routes, count) => {
    for (let i=0; i<250 && routes.length<count; i++) await new Promise(resolve => setTimeout(resolve,20));
    assert.equal(routes.length,count,'Recommendation HTTP request did not start');
  };
  const answer = (route, recommendations) => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({recommendations})});

  // Slow profile/history/recommendations must never replace the dashboard with a full-page spinner.
  {
    const {page,recommendations} = await open('?slowProfile=1');
    await waitRequest(page,'recent','alice');
    assert.equal(await page.evaluate(() => window.dashboardFixture.requests.some(r => r.kind==='favorites')),false);
    await finish(page,'recent','alice',[{id:'dal',dishName:'Dal'}]);
    await page.getByText('Dal',{exact:true}).waitFor();
    await page.evaluate(() => window.setDashboardProfileLoading(false));
    await waitRequest(page,'favorites','alice');
    await finish(page,'favorites','alice',[{dishName:'Idli'}]);
    await waitRecommendation(recommendations,1);
    assert.equal(await page.getByRole('button',{name:/Use Ingredients/}).isVisible(),true);
    assert.equal(await page.getByText('Dal',{exact:true}).isVisible(),true);
    await recommendations[0].fulfill({status:400,contentType:'application/json',body:'{}'});
    await page.getByText('Recommendations are unavailable right now. You can still start a recipe.').waitFor();
    assert.equal(await page.getByText('Dal',{exact:true}).isVisible(),true);
    if (process.env.DASHBOARD_SCREENSHOT) await page.screenshot({path:process.env.DASHBOARD_SCREENSHOT,fullPage:true});
    await page.close();
    console.log('PASS: slow profile and recommendations leave dashboard actions and recent dishes usable');
  }
  // An optional history failure must not prevent a separate recommendation request.
  {
    const {page,recommendations} = await open();
    await waitRequest(page,'recent','alice');
    await waitRequest(page,'favorites','alice');
    await finish(page,'recent','alice',null,true);
    await page.getByText('Recent creations are unavailable right now. You can still start a new recipe.').waitFor();
    await finish(page,'favorites','alice',[{dishName:'Idli'}]);
    await waitRecommendation(recommendations,1);
    await answer(recommendations[0],['Dosa']);
    await page.getByRole('button',{name:/Dosa/}).waitFor();
    await page.close();
    console.log('PASS: failed history does not prevent recommendations');
  }
  // Late data from an old account must not repopulate a new account or a guest dashboard.
  {
    const {page,recommendations} = await open();
    await waitRequest(page,'recent','alice');
    await waitRequest(page,'favorites','alice');
    await finish(page,'favorites','alice',[{dishName:'Alice favorite'}]);
    await waitRecommendation(recommendations,1);
    await page.evaluate(() => window.setDashboardUser('bob'));
    await waitRequest(page,'recent','bob');
    await waitRequest(page,'favorites','bob');
    await finish(page,'recent','bob',[{id:'bob-soup',dishName:'Bob soup'}]);
    await finish(page,'favorites','bob',[{dishName:'Bob favorite'}]);
    await waitRecommendation(recommendations,2);
    await answer(recommendations[1],['Bob recommendation']);
    await page.getByRole('button',{name:/Bob recommendation/}).waitFor();
    await finish(page,'recent','alice',[{id:'alice-late',dishName:'Alice late'}]);
    await answer(recommendations[0],['Alice recommendation']);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.getByText('Alice late',{exact:true}).count(),0);
    assert.equal(await page.getByRole('button',{name:/Alice recommendation/}).count(),0);
    assert.equal(await page.getByText('Bob soup',{exact:true}).isVisible(),true);
    await page.evaluate(() => window.setDashboardUser(null));
    await page.getByText('Log in to see and save your recent dishes.').waitFor();
    assert.equal(await page.getByText('Bob soup',{exact:true}).count(),0);
    assert.equal(await page.getByRole('button',{name:/Bob recommendation/}).count(),0);
    await page.close();
    console.log('PASS: account changes and sign-out ignore stale history and recommendations');
  }
  assert.deepEqual(pageErrors,[]);
} finally {
  await browser?.close();
  await vite.close();
}
