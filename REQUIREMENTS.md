# Feature Requirements: [Feature Name]

## 🎯 Goal
Administrators can create a poll to schedule the next book club and users can provide their availability

## 📋 Detailed Requirements
*List your structured requirements here:*
- [ ] Users must be able to create a persistent account. Accounts are authenticated with sms. Users can set their display names when logged in.
- [ ] The administrator account is tied to my phone number: 15102198730 
- [ ] The administrator can choose dates from a calendar as options for the next book club. Before the administrator does this, users see a UI element "Date Selection" that says: The host is choosing dates for the next book club
- [ ] Once the administrator has selected dates, users who log into the site will see a new option in the Date Selection UI element to select the dates they are available for the next book club
- [ ] Each date can be answered with: one of: Yes, No, Maybe
- [ ] While date selection is in progress, the Date Selection UI element shows what other users have answered for each date
- [ ] The administrator makes a final selection for the date. Then the Date Selection UI element is replaced with text that says "The next book club is [DATE]" along with the availability for that date from all users who participated
- [ ] Users can no longer add or edit availability after Date Selection is complete
- [ ] We will eventually update the ranked choice voting page to use these user accounts. But don't change that for now.

## 🎨 Design & UI Preferences
The Date Selection UI element is displayed under the next book icon. The admin date selector is a calendar with selectable dates. The user facing Date Selection UI is a list with icons for marking status, and display names with highlighted color to show their vote (red = No, yellow = Maybe, Green = Yes)


## 🛠️ Technical Constraints (Optional)
This feature will require a database to store user info, the scheduling status and options, and user date selections. Provide instructions to set this up on AWS. Use whatever software you recommend.

---
*Save this file and tell me "I've updated the requirements" when you are ready!*
