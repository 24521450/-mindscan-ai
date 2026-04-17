## Fix Syntax Errors in src/App.tsx - Approved Plan Implementation

### Current Progress: 6/8 steps complete

**Step 1: Fix file comment typo and organize imports**
- [x] Change "lots of errors in appp.tsx" → "App.tsx" ✅

**Step 2: Reorder React hooks (move useRef/useState before useEffect)**  
- [x] Move `radarRef`, `languageMenuRef` declarations to top ✅  
- [x] Ensure all hooks before any useEffect ✅

**Step 3: Fix TypeScript useState generic for formData**
- [x] Add `<FormData, React.Dispatch<React.SetStateAction<FormData>>>` ✅

**Step 4: Fix LiquidButton Icon → icon prop reference**
- [x] Replace `Icon && <Icon className=...` with `icon && <Icon className=...` ✅

**Step 5: Inline t() function earlier or wrap in useCallback**  
- [x] Move translation helper before first usage ✅

**Step 6: Remove duplicate navigation buttons in results section**  
- [x] Keep only top-left/right nav; delete bottom duplicates ✅

**Step 7: Fix malformed JSX in results/dashboard/analytics**
- [ ] Single conditional block for views
- [ ] Fix pointerEvents + display conflicts
- [ ] Close all unclosed divs/tags

**Step 8: Add prop guards and fix destructuring**
- [ ] CustomStackedBar, ActionCard optional props
- [ ] getFeatureLabel type safety

**Post-edit validation:**
- [ ] `npm run build` or `tsc --noEmit`
- [ ] Test survey → results flow
- [ ] Test dark mode, i18n, charts
- [ ] attempt_completion

**Next:** Implement Step 1 after confirmation.

