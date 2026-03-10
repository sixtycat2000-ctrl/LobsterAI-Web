# LobsterAI Web UI Integration Test Plan

Created: 2026-03-10 | Last Updated: 2026-03-10

---

## Overview

This document defines the UI integration test plan for LobsterAI Web, covering all interactive UI components and user workflows. Tests should verify both happy paths and edge cases.

---

## Test Environment

| Item | Value |
|------|-------|
| Server URL | http://localhost:3001 |
| Web UI | http://localhost:5176 (dev) / http://localhost:3001 (prod) |
| Default Workspace | User home directory |
| User Data | `~/.lobsterai/web` |
| Node Version | >= 20 |

---

## Test Modules

### 1. Navigation & Sidebar

**Component:** `src/renderer/components/Sidebar.tsx`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| NAV-001 | Sidebar collapse/expand | Click sidebar toggle button | Sidebar collapses to width 0, toggle icon changes |
| NAV-002 | New Chat button | Click "New Chat" button | Creates new cowork session, switches to cowork view |
| NAV-003 | Search button | Click "Search" button | Opens CoworkSearchModal |
| NAV-004 | Scheduled Tasks nav | Click "Scheduled Tasks" button | Switches to ScheduledTasksView |
| NAV-005 | Skills nav | Click "Skills" button | Switches to SkillsView |
| NAV-006 | MCP Servers nav | Click "MCP Servers" button | Switches to McpView |
| NAV-007 | Settings button | Click "Settings" button | Opens Settings panel |
| NAV-008 | Active view indicator | Navigate between views | Current view button shows accent color highlight |
| NAV-009 | Cowork history list | View session list in sidebar | Shows pinned sessions first, then by date |
| NAV-010 | Session selection | Click on a session in history | Loads and displays selected session |

---

### 2. Task Search (Cowork Sessions)

**Component:** `src/renderer/components/cowork/CoworkSearchModal.tsx`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SEARCH-001 | Open search modal | Click Search button or use shortcut | Modal opens with focus on search input |
| SEARCH-002 | Search by title | Type query matching session title | Filters sessions to matching results |
| SEARCH-003 | Search no results | Type query with no matches | Shows "No results" message |
| SEARCH-004 | Clear search | Delete all text | Shows all sessions |
| SEARCH-005 | Select session from results | Click a session in results | Loads session, closes modal |
| SEARCH-006 | Delete session from results | Click delete on session in search | Session is deleted |
| SEARCH-007 | Pin session from results | Click pin on session | Session pin status toggles |
| SEARCH-008 | Rename session from results | Double-click title, edit, press Enter | Session title is updated |
| SEARCH-009 | Close modal - X button | Click X button | Modal closes |
| SEARCH-010 | Close modal - backdrop | Click outside modal | Modal closes |
| SEARCH-011 | Close modal - Escape | Press Escape key | Modal closes |

---

### 3. Scheduled Tasks CRUD

**Components:** `src/renderer/components/scheduledTasks/`

#### 3.1 Task List View

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TASK-LIST-001 | Display task list | Navigate to Scheduled Tasks | Shows all tasks with columns: Title, Schedule, Status |
| TASK-LIST-002 | Empty state | View when no tasks exist | Shows empty state with icon and hint |
| TASK-LIST-003 | Task toggle enable/disable | Click toggle switch on task | Task enabled status toggles, schedule updated |
| TASK-LIST-004 | Task toggle - past date warning | Enable a one-time task with past date | Shows warning toast |
| TASK-LIST-005 | Task toggle - expired warning | Enable an expired task | Shows expired warning toast |
| TASK-LIST-006 | View task detail | Click on task row | Shows TaskDetail view |
| TASK-LIST-007 | Open more menu | Click ellipsis button | Shows dropdown with Run, Edit, Delete |
| TASK-LIST-008 | Run task now | Click "Run" from menu | Task starts running, shows spinner |
| TASK-LIST-009 | Edit from menu | Click "Edit" from menu | Opens TaskForm in edit mode |
| TASK-LIST-010 | Delete from menu | Click "Delete" from menu | Opens delete confirmation modal |
| TASK-LIST-011 | Running indicator | View task that is running | Shows spinning indicator |
| TASK-LIST-012 | Back button navigation | In detail/edit view, click back | Returns to task list |

#### 3.2 Create Task

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TASK-CREATE-001 | Open create form | Click "New Task" button | Shows TaskForm in create mode |
| TASK-CREATE-002 | Validation - empty name | Leave name empty, submit | Shows "Name required" error |
| TASK-CREATE-003 | Validation - empty prompt | Leave prompt empty, submit | Shows "Prompt required" error |
| TASK-CREATE-004 | Validation - empty working directory | No directory set, submit | Shows error if no default |
| TASK-CREATE-005 | Validation - past datetime | Select past date for one-time task | Shows "Must be future date" error |
| TASK-CREATE-006 | Schedule type - once | Select "Once", pick date and time | Creates task with datetime schedule |
| TASK-CREATE-007 | Schedule type - daily | Select "Daily", pick time | Creates task with daily cron |
| TASK-CREATE-008 | Schedule type - weekly | Select "Weekly", pick day and time | Creates task with weekly cron |
| TASK-CREATE-009 | Schedule type - monthly | Select "Monthly", pick day and time | Creates task with monthly cron |
| TASK-CREATE-010 | Browse directory | Click "Browse" button | Opens directory picker dialog |
| TASK-CREATE-011 | Set expiry date | Pick expiry date | Task will expire on that date |
| TASK-CREATE-012 | Clear expiry date | Click clear button | Expiry date is cleared |
| TASK-CREATE-013 | Notification platforms | Open dropdown, select platforms | Platforms are selected (only configured ones) |
| TASK-CREATE-014 | Cancel create | Click "Cancel" button | Returns to task list without saving |
| TASK-CREATE-015 | Successful create | Fill all required fields, submit | Task created, returns to list |

#### 3.3 Edit Task

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TASK-EDIT-001 | Open edit from detail | In detail view, click edit button | Opens TaskForm with pre-filled data |
| TASK-EDIT-002 | Open edit from menu | Click "Edit" from task menu | Opens TaskForm with pre-filled data |
| TASK-EDIT-003 | Modify and save | Change fields, click save | Task updated, returns to detail view |
| TASK-EDIT-004 | Cancel edit | Click "Cancel" | Returns to detail view without changes |

#### 3.4 Delete Task

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TASK-DELETE-001 | Request delete | Click delete button | Opens DeleteConfirmModal |
| TASK-DELETE-002 | Confirm delete | Click confirm button | Task deleted, returns to list |
| TASK-DELETE-003 | Cancel delete | Click cancel button | Modal closes, task not deleted |
| TASK-DELETE-004 | Delete from detail view | Delete while viewing detail | Task deleted, returns to list |

#### 3.5 Task Detail View

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TASK-DETAIL-001 | View all sections | Open task detail | Shows Prompt, Configuration, Status, Run History |
| TASK-DETAIL-002 | Edit button | Click pencil icon | Opens TaskForm in edit mode |
| TASK-DETAIL-003 | Run now button | Click play icon | Task starts running immediately |
| TASK-DETAIL-004 | Delete button | Click trash icon | Opens delete confirmation |
| TASK-DETAIL-005 | Run now disabled | Task already running | Button is disabled |
| TASK-DETAIL-006 | View run history | Scroll to history section | Shows list of past runs |
| TASK-DETAIL-007 | View session from run | Click "View Session" link | Navigates to cowork session |
| TASK-DETAIL-008 | Load more runs | Click "Load More" | Loads additional run history |

---

### 4. Task History

**Components:** `AllRunsHistory.tsx`, `TaskRunHistory.tsx`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| HISTORY-001 | View all runs tab | Click "History" tab | Shows AllRunsHistory with all task runs |
| HISTORY-002 | Empty history state | View with no runs | Shows empty state message |
| HISTORY-003 | Run status display | View runs list | Shows success (green), error (red), running (blue) |
| HISTORY-004 | Running indicator | View running task | Shows spinning animation |
| HISTORY-005 | View session | Click on run with session | Navigates to cowork session |
| HISTORY-006 | Load more | Click "Load More" button | Loads next 50 runs |
| HISTORY-007 | Duration display | View completed runs | Shows duration in ms, s, or m |
| HISTORY-008 | Task detail history | Open task detail | Shows task-specific run history |
| HISTORY-009 | Error message display | View failed run | Shows truncated error message |
| HISTORY-010 | Trigger type | View runs | Shows "Manual" or "Scheduled" label |

---

### 5. Skills Management

**Components:** `src/renderer/components/skills/`

#### 5.1 Installed Skills

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SKILL-INST-001 | View installed skills | Navigate to Skills | Shows grid of installed skills |
| SKILL-INST-002 | Empty state | No skills installed | Shows "No skills available" message |
| SKILL-INST-003 | Search skills | Type in search box | Filters skills by name/description |
| SKILL-INST-004 | Toggle skill enabled | Click toggle switch | Skill enabled status changes |
| SKILL-INST-005 | View skill detail | Click on skill card | Opens skill detail modal |
| SKILL-INST-006 | Delete skill | Click trash icon in card | Opens delete confirmation |
| SKILL-INST-007 | Delete built-in skill | Try to delete built-in | Shows error, cannot delete |
| SKILL-INST-008 | Skill badge display | View skill cards | Shows Official, Version, Updated date |

#### 5.2 Add Skills

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SKILL-ADD-001 | Open add menu | Click "Add Skill" button | Shows dropdown with options |
| SKILL-ADD-002 | Upload ZIP | Click "Upload ZIP" option | Opens file picker for .zip |
| SKILL-ADD-003 | Upload folder | Click "Upload Folder" option | Opens directory picker |
| SKILL-ADD-004 | GitHub import | Click "Import from GitHub" | Opens GitHub URL input modal |
| SKILL-ADD-005 | GitHub import - valid URL | Enter valid GitHub URL, submit | Skill downloads and installs |
| SKILL-ADD-006 | GitHub import - invalid URL | Enter invalid URL, submit | Shows error message |
| SKILL-ADD-007 | Cancel GitHub import | Click X or Escape | Modal closes |
| SKILL-ADD-008 | Close add menu | Click outside menu | Menu closes |

#### 5.3 Skill Marketplace

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SKILL-MKT-001 | View marketplace | Click "Marketplace" tab | Shows marketplace skills |
| SKILL-MKT-002 | Filter by category | Click category tag | Filters to selected category |
| SKILL-MKT-003 | Search marketplace | Type in search box | Filters marketplace skills |
| SKILL-MKT-004 | Install from marketplace | Click "Install" button | Skill downloads and installs |
| SKILL-MKT-005 | Already installed badge | View installed skill in marketplace | Shows "Installed" badge |
| SKILL-MKT-006 | View marketplace detail | Click skill card | Opens skill detail modal |
| SKILL-MKT-007 | Install from detail | Click Install in modal | Skill downloads and installs |
| SKILL-MKT-008 | Loading state | Initial marketplace load | Shows loading indicator |

#### 5.4 Skill Detail Modal

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SKILL-MODAL-001 | View installed detail | Click installed skill | Shows name, description, source, version |
| SKILL-MODAL-002 | Toggle from modal | Click toggle in modal | Skill enabled status changes |
| SKILL-MODAL-003 | Delete from modal | Click Delete button | Opens delete confirmation |
| SKILL-MODAL-004 | Close modal - X | Click X button | Modal closes |
| SKILL-MODAL-005 | Close modal - backdrop | Click outside modal | Modal closes |
| SKILL-MODAL-006 | Close modal - Escape | Press Escape | Modal closes |
| SKILL-MODAL-007 | Open source URL | Click URL link | Opens URL in external browser |

#### 5.5 Delete Skill Confirmation

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SKILL-DEL-001 | Request delete | Click delete on skill | Opens confirmation modal |
| SKILL-DEL-002 | Confirm delete | Click confirm button | Skill deleted, modal closes |
| SKILL-DEL-003 | Cancel delete | Click cancel button | Modal closes, skill not deleted |
| SKILL-DEL-004 | Delete error | Delete fails | Shows error message in modal |

---

### 6. MCP Servers Management

**Components:** `src/renderer/components/mcp/`

#### 6.1 Installed MCP Servers

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| MCP-INST-001 | View installed servers | Navigate to MCP | Shows grid of installed servers |
| MCP-INST-002 | Empty state | No servers installed | Shows "No installed servers" message |
| MCP-INST-003 | Search servers | Type in search box | Filters servers by name/description |
| MCP-INST-004 | Toggle server enabled | Click toggle switch | Server enabled status changes |
| MCP-INST-005 | Edit server | Click pencil icon | Opens McpServerFormModal |
| MCP-INST-006 | Delete server | Click trash icon | Opens delete confirmation |
| MCP-INST-007 | Transport type badge | View server cards | Shows stdio/sse/http badge |
| MCP-INST-008 | Required keys indicator | Server requires env keys | Shows count of required keys |

#### 6.2 MCP Marketplace

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| MCP-MKT-001 | View marketplace | Click "Marketplace" tab | Shows available MCP servers |
| MCP-MKT-002 | Filter by category | Click category pill | Filters to selected category |
| MCP-MKT-003 | Search marketplace | Type in search box | Filters marketplace entries |
| MCP-MKT-004 | Install from marketplace | Click "Install" button | Opens form modal pre-filled |
| MCP-MKT-005 | Already installed | View installed server in marketplace | Shows "Installed" badge |
| MCP-MKT-006 | View transport info | View server card | Shows transport type and command |

#### 6.3 Custom MCP Servers

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| MCP-CUST-001 | View custom tab | Click "Custom" tab | Shows custom servers + add button |
| MCP-CUST-002 | Add custom server | Click "+ Add Server" card | Opens empty form modal |
| MCP-CUST-003 | Edit custom server | Click edit on custom server | Opens form modal with data |
| MCP-CUST-004 | Delete custom server | Click delete on custom server | Opens delete confirmation |
| MCP-CUST-005 | Toggle custom server | Click toggle on custom server | Server enabled status changes |

#### 6.4 MCP Server Form Modal

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| MCP-FORM-001 | Create new server | Fill form, click save | Server created, modal closes |
| MCP-FORM-002 | Edit existing server | Modify form, click save | Server updated, modal closes |
| MCP-FORM-003 | Install from registry | Pre-filled from marketplace | Form shows registry defaults |
| MCP-FORM-004 | Validation - name required | Empty name, submit | Shows validation error |
| MCP-FORM-005 | Validation - duplicate name | Enter existing name | Shows validation error |
| MCP-FORM-006 | Transport type change | Select different transport | Form shows relevant fields |
| MCP-FORM-007 | Cancel form | Click cancel or close | Modal closes without saving |
| MCP-FORM-008 | Environment variables | View/edit env vars | Shows key-value pairs |

#### 6.5 Delete MCP Server Confirmation

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| MCP-DEL-001 | Request delete | Click delete on server | Opens confirmation modal |
| MCP-DEL-002 | Confirm delete | Click confirm button | Server deleted, modal closes |
| MCP-DEL-003 | Cancel delete | Click cancel button | Modal closes, server not deleted |
| MCP-DEL-004 | Delete error | Delete fails | Shows error message in modal |

---

### 7. Batch Operations (Cowork Sessions)

**Component:** `Sidebar.tsx`, `CoworkSessionList.tsx`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| BATCH-001 | Enter batch mode | Long-press or context menu on session | Enters batch mode, session selected |
| BATCH-002 | Toggle selection | Click session checkbox | Selection toggles |
| BATCH-003 | Select all | Click "Select All" checkbox | All sessions selected |
| BATCH-004 | Deselect all | Click "Select All" when all selected | All deselected |
| BATCH-005 | Batch delete button | With selections, click delete | Opens batch delete confirmation |
| BATCH-006 | Batch delete disabled | No selections | Delete button disabled |
| BATCH-007 | Confirm batch delete | Click confirm in modal | Selected sessions deleted |
| BATCH-008 | Cancel batch delete | Click cancel in modal | Modal closes, nothing deleted |
| BATCH-009 | Exit batch mode | Click "Cancel" button | Exits batch mode |
| BATCH-010 | Exit on sidebar collapse | Collapse sidebar | Exits batch mode |

---

### 8. Cowork Session Operations

**Components:** `CoworkSessionList.tsx`, `CoworkSessionItem.tsx`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| COWORK-001 | Select session | Click on session | Session loads, becomes current |
| COWORK-002 | Delete session | Click delete on session | Session deleted from list |
| COWORK-003 | Pin session | Click pin icon | Session pinned, moves to top |
| COWORK-004 | Unpin session | Click pin icon on pinned | Session unpinned |
| COWORK-005 | Rename session | Double-click title, edit | Session title updated |
| COWORK-006 | Cancel rename | Double-click, press Escape | Title not changed |
| COWORK-007 | Pinned section | View list with pinned | Pinned sessions shown first |
| COWORK-008 | Date grouping | View list | Sessions grouped by date |

---

### 9. Settings Panel

**Component:** `src/renderer/components/Settings.tsx`

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SET-001 | Open settings | Click Settings button | Settings panel opens |
| SET-002 | Tab navigation | Click different tabs | Tab content switches |
| SET-003 | General tab | View General tab | Shows theme, language options |
| SET-004 | Model tab | View Model tab | Shows API key, model selection |
| SET-005 | Email tab | View Email tab | Shows email configuration |
| SET-006 | Memory tab | View Memory tab | Shows memory entries |
| SET-007 | Shortcuts tab | View Shortcuts tab | Shows keyboard shortcuts |
| SET-008 | About tab | View About tab | Shows version, info |
| SET-009 | Theme toggle | Toggle dark/light | Theme changes immediately |
| SET-010 | Language toggle | Switch language | All UI text updates |
| SET-011 | API key visibility | Click show/hide | API key visibility toggles |
| SET-012 | Save settings | Modify and save | Settings saved, toast shown |
| SET-013 | Close settings | Click X or outside | Settings panel closes |

---

## Test Execution Checklist

### Pre-requisites
- [ ] Server running on port 3001
- [ ] Clean database (or known state)
- [ ] Test workspace directory exists
- [ ] Browser dev tools available for debugging

### Test Run Summary Template

| Module | Total | Passed | Failed | Blocked |
|--------|-------|--------|--------|---------|
| Navigation | 10 | | | |
| Search | 11 | | | |
| Task List | 12 | | | |
| Task Create | 15 | | | |
| Task Edit | 4 | | | |
| Task Delete | 4 | | | |
| Task Detail | 8 | | | |
| Task History | 10 | | | |
| Skills Installed | 8 | | | |
| Skills Add | 8 | | | |
| Skills Marketplace | 8 | | | |
| Skills Modal | 7 | | | |
| Skills Delete | 4 | | | |
| MCP Installed | 8 | | | |
| MCP Marketplace | 6 | | | |
| MCP Custom | 5 | | | |
| MCP Form | 8 | | | |
| MCP Delete | 4 | | | |
| Batch Operations | 10 | | | |
| Cowork Sessions | 8 | | | |
| Settings | 13 | | | |
| **TOTAL** | **171** | | | |

---

## Bug Reporting Template

```markdown
## Bug: [Short Description]

**Test ID:** [e.g., TASK-CREATE-003]
**Severity:** Critical / High / Medium / Low
**Priority:** P1 / P2 / P3

### Steps to Reproduce
1.
2.
3.

### Expected Result


### Actual Result


### Environment
- Browser:
- OS:
- Node Version:
- App Version:

### Screenshots/Logs


### Additional Notes

```

---

## Automated Testing Notes

### Recommended Tools
- **Playwright** or **Cypress** for E2E testing
- **Testing Library** for component testing
- **MSW** for API mocking

### Key Selectors (data-testid recommendations)

```html
<!-- Navigation -->
<button data-testid="nav-new-chat">
<button data-testid="nav-search">
<button data-testid="nav-scheduled-tasks">
<button data-testid="nav-skills">
<button data-testid="nav-mcp">
<button data-testid="nav-settings">

<!-- Search Modal -->
<div data-testid="search-modal">
<input data-testid="search-input">
<button data-testid="search-close">

<!-- Tasks -->
<button data-testid="task-new">
<div data-testid="task-list">
<div data-testid="task-item-{id}">
<button data-testid="task-toggle-{id}">
<button data-testid="task-menu-{id}">
<div data-testid="task-form">
<button data-testid="task-submit">

<!-- Skills -->
<div data-testid="skill-list">
<div data-testid="skill-item-{id}">
<button data-testid="skill-toggle-{id}">
<button data-testid="skill-delete-{id}">
<button data-testid="skill-add">
<div data-testid="skill-marketplace">

<!-- MCP -->
<div data-testid="mcp-list">
<div data-testid="mcp-item-{id}">
<button data-testid="mcp-toggle-{id}">
<button data-testid="mcp-edit-{id}">
<button data-testid="mcp-delete-{id}">
<div data-testid="mcp-form">
```

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-03-10 | Initial test plan created |
