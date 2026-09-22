#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================
## user_problem_statement: "Lanjutkan pembuatan aplikasi KPI (IT Ticketing & KPI Management System) dari GitHub agar bisa di-deploy secara lokal/produksi menggunakan Docker."

## backend:
##   - task: "Configurable auth cookie flags (COOKIE_SECURE/COOKIE_SAMESITE/COOKIE_DOMAIN)"
##     implemented: true
##     working: true
##     file: "backend/server.py"
##     stuck_count: 0
##     priority: "high"
##     needs_retesting: false
##     status_history:
##         -working: "NA"
##         -agent: "main"
##         -comment: "Made set_auth_cookies read COOKIE_SECURE/SAMESITE/DOMAIN from env. Defaults preserved (secure=true, samesite=none) so preview keeps working. Verified via curl: login 200 + Set-Cookie SameSite=none; Secure."
##         -working: true
##         -agent: "testing"
##         -comment: "REGRESSION TEST PASSED: POST /api/auth/login returns 200 with httpOnly cookies. Verified SameSite=none and Secure flags are present in Set-Cookie headers for both access_token and refresh_token. Cookie-based auth flow working correctly in HTTPS preview environment."
##   - task: "Health endpoint /api/health"
##     implemented: true
##     working: true
##     file: "backend/server.py"
##     stuck_count: 0
##     priority: "medium"
##     needs_retesting: false
##     status_history:
##         -working: true
##         -agent: "main"
##         -comment: "Added GET /api/health returning status+db ping. Verified: {'status':'ok','database':true}."
##         -working: true
##         -agent: "testing"
##         -comment: "REGRESSION TEST PASSED: GET /api/health returns 200 with correct JSON structure {'status':'ok','database':true}. Database connectivity confirmed."
##   - task: "SEED_DEMO env guard for demo users/tickets"
##     implemented: true
##     working: true
##     file: "backend/server.py"
##     stuck_count: 0
##     priority: "medium"
##     needs_retesting: false
##     status_history:
##         -working: "NA"
##         -agent: "main"
##         -comment: "Demo users + demo tickets now only seed when SEED_DEMO=true (default true preserves preview). Admin + categories + settings always seeded. Docker uses SEED_DEMO=false."
##         -working: true
##         -agent: "testing"
##         -comment: "REGRESSION TEST PASSED: GET /api/users returns 8 users including admin@itsm.local and 4 demo accounts (manager, supervisor, tech1, customer1). SEED_DEMO=true default working correctly in preview. Seeding behavior preserved."

## metadata:
##   created_by: "main_agent"
##   version: "1.2"
##   test_sequence: 2
##   run_ui: false

## test_plan:
##   current_focus:
##     - "Configurable auth cookie flags (COOKIE_SECURE/COOKIE_SAMESITE/COOKIE_DOMAIN)"
##     - "Health endpoint /api/health"
##     - "SEED_DEMO env guard for demo users/tickets"
##   stuck_tasks: []
##   test_all: false
##   test_priority: "high_first"

## agent_communication:
##     -agent: "main"
##     -message: "Added Docker deployment (mongo + FastAPI backend + React/Nginx frontend, same-origin /api proxy). Backend code changes are minimal & env-gated. Please run a focused REGRESSION test on auth flow (login with admin@itsm.local/admin123, /api/auth/me, logout) and GET /api/health. Do NOT change any cookie/seed behavior; defaults must remain intact for the running preview. No need to test the full ticket/KPI suite unless auth is impacted."
##     -agent: "testing"
##     -message: "REGRESSION TEST COMPLETE - ALL PASSED ✅. Tested 5 critical scenarios: (1) Health endpoint returns 200 with correct JSON, (2) Login with admin@itsm.local/admin123 returns 200 with httpOnly cookies (SameSite=none; Secure verified), (3) Auth /me with cookies returns 200 with admin user data, (4) Logout returns 200 and clears cookies, (5) Seeding confirmed working with 8 users (admin + 4 demo accounts). No regressions detected. Cookie behavior and seeding defaults preserved correctly for preview environment."
