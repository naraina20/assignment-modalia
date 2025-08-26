# Modalia Assignment project

# 1. Clone the repository
git clone https://github.com/naraina20/assignment-modalia
cd modelia

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Open the app in your browser
# Visit http://localhost:5173

# 5. Run Cypress end-to-end tests (optional)
npm run test


## Bonus Features Implemented

### 1. Performance Optimizations
- Used `useMemo` to memoize the preview component to prevent unnecessary re-renders.
- Optimized image downscaling on the client-side for large images to reduce memory usage.
- Reduced computation in the generate function by caching results in local state.

### 2. Error Boundaries
- Created a React `ErrorBoundary` component to catch runtime errors and display user-friendly messages.
- Ensures the app does not crash entirely if any component throws an error.

### 3. Empty States
- Added placeholder UI for empty image preview, history panel, and default prompts.
- Guides users on what to do when no data is available.

### 4. Cypress End-to-End Tests
- Automated test for full app flow including:
  - Uploading an image, entering a prompt, selecting a style, and clicking Generate.
  - Handling “Model overloaded” simulated errors and retries.
  - Checking live summary updates and history panel behavior.
  - Testing Abort and Clear functionality.
- Ensures core features work consistently and regressions are minimized.

## Took more time
- I know the project is simple and expected to take lessor time to complete but I thought that I should complete it without taking help of Ai at least the core functionality of that webapp. So it took time to think about genrate function and all. 
- One more reason for the late submission is the use of Cypress. I used Cypress in my previous company at a basic level, and it took me some time to get it done.

## Leverage AI to accelerate workflow

1. Give whole assignment details to gpt to ask query directly in that chat further. (didn't ask to create code for anything yet)
2. clear some doubt related assignment like live summary?, upload image is require or what?, what is aria lable and what is the purpose of it.
3. create some code for minor functions like Wait() function.
4. some doubts related React with typescript, What types should use etc.
