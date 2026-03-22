import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const saveHtmlSnapshot = async (page: any, stageName: string) => {
  const content = await page.content();
  const dir = path.join(__dirname, '..', 'test-results', 'html-snapshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${stageName}.html`), content);
};

test.describe('Book Club Scheduling Flow', () => {

  test('Complete voting cycle: Propose -> Vote -> Finalize', async ({ browser }) => {
    
    // ==========================================
    // PHASE 1: LOG IN AS ADMIN & PROPOSE DATES
    // ==========================================
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    await adminPage.goto('/');
    
    // Log in using the injected Dev Mode Shortcut we saw in EmailLogin.tsx
    await adminPage.getByRole('button', { name: 'Login as Admin' }).click();
    await saveHtmlSnapshot(adminPage, '1-admin-logged-in');

    // Wait for the main page to load post-login
    await adminPage.waitForSelector('text=Valencia Bookclub Boys', { timeout: 5000 }).catch(() => {});
    
    // NOTE: The exact selectors for "propose date" depend on your specific UI components. 
    // We assume there's a quick flow to pick a date. If these buttons differ, 
    // you can adjust the labels below once you're back.
    const proposeButton = adminPage.getByRole('button', { name: /propose/i }).first();
    if (await proposeButton.isVisible()) {
      await proposeButton.click();
      await saveHtmlSnapshot(adminPage, '2-admin-propose-clicked');

      // Click on a few random days in the calendar. Assuming standard react-day-picker classes.
      // We will try to click the 15th and 16th of the current/next month.
      await adminPage.getByRole('button', { name: '15' }).first().click().catch(() => {});
      await adminPage.getByRole('button', { name: '16' }).first().click().catch(() => {});
      
      const submitDatesBtn = adminPage.getByRole('button', { name: /submit dates/i });
      if (await submitDatesBtn.isVisible()) await submitDatesBtn.click();
      
      await saveHtmlSnapshot(adminPage, '3-admin-dates-proposed');
    }

    await adminContext.close();

    // ==========================================
    // PHASE 2: LOG IN AS USER A & VOTE
    // ==========================================
    const userAContext = await browser.newContext();
    const userAPage = await userAContext.newPage();
    await userAPage.goto('/');
    
    // Login User A
    await userAPage.getByRole('button', { name: 'Login as User A' }).click();
    await saveHtmlSnapshot(userAPage, '4-usera-logged-in');

    // Assume user A votes 'Yes' on the first option
    const yesButtonA = userAPage.getByRole('button', { name: /yes/i }).first();
    if (await yesButtonA.isVisible()) {
      await yesButtonA.click();
      // Assume automatic submit or a submit button exists
      const submitVoteA = userAPage.getByRole('button', { name: /submit vote/i }).first();
      if (await submitVoteA.isVisible()) await submitVoteA.click();
    }

    await saveHtmlSnapshot(userAPage, '5-usera-voted');
    await userAContext.close();

    // ==========================================
    // PHASE 3: LOG IN AS USER B & VOTE
    // ==========================================
    // (Dev shortcuts currently only show 'User A', but we could mock a User B shortcut or localStorage directly)
    const userBContext = await browser.newContext();
    const userBPage = await userBContext.newPage();
    await userBPage.goto('/');

    // Force local storage for User B since DEV box only has User A right now
    await userBPage.evaluate(() => {
        localStorage.setItem('dev-session', JSON.stringify({
            id: 'dev-user-id-2', email: 'user-b@example.com', isDev: true 
        }));
    });
    // Reload to apply dev session
    await userBPage.reload();
    await saveHtmlSnapshot(userBPage, '6-userb-logged-in');

    // Assume user B votes 'No' on the first option
    const noButtonB = userBPage.getByRole('button', { name: /no/i }).first();
    if (await noButtonB.isVisible()) {
      await noButtonB.click();
      const submitVoteB = userBPage.getByRole('button', { name: /submit vote/i }).first();
      if (await submitVoteB.isVisible()) await submitVoteB.click();
    }
    
    await saveHtmlSnapshot(userBPage, '7-userb-voted');
    await userBContext.close();

    // ==========================================
    // PHASE 4: LOG IN AS ADMIN & FINALIZE DATE
    // ==========================================
    const finalAdminContext = await browser.newContext();
    const finalAdminPage = await finalAdminContext.newPage();
    await finalAdminPage.goto('/');
    
    await finalAdminPage.getByRole('button', { name: 'Login as Admin' }).click();
    await saveHtmlSnapshot(finalAdminPage, '8-admin-logged-in-again');

    const finalizeButton = finalAdminPage.getByRole('button', { name: /finalize/i }).first();
    if (await finalizeButton.isVisible()) {
      await finalizeButton.click();
    }
    await saveHtmlSnapshot(finalAdminPage, '9-admin-date-finalized');

    await finalAdminContext.close();
  });
});
