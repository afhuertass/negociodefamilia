# Custom Combobox Implementation Plan

> **For agentic workers:** Execute this plan in the current session.

**Goal:** Create a lightweight, dependency-free `Combobox` component for participant selection to improve UX.

**Architecture:**
1. Create `app/components/Combobox.tsx`.
2. Update `app/entrar/page.tsx` to use `Combobox` instead of `<select>`.

---

### Task 1: Create `app/components/Combobox.tsx`

**Files:**
- Create: `app/components/Combobox.tsx`

- [ ] **Step 1: Write the Combobox component code**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";

export default function Combobox({ options }: { options: { name: string }[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((o) =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        className="input mt-1 w-full"
        placeholder="Escribe tu nombre..."
        value={selectedName || searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setSelectedName(""); // Clear selection when typing
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        required
      />
      {/* Hidden input for form submission */}
      <input type="hidden" name="name" value={selectedName} required />
      
      {isOpen && searchTerm.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white border border-slate-200 shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <li
                key={option.name}
                className="cursor-pointer px-4 py-2 hover:bg-slate-100"
                onClick={() => {
                  setSelectedName(option.name);
                  setSearchTerm(option.name);
                  setIsOpen(false);
                }}
              >
                {option.name}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-slate-500">No encontrado</li>
          )}
        </ul>
      )}
    </div>
  );
}
```

### Task 2: Integrate `Combobox` into `app/entrar/page.tsx`

**Files:**
- Modify: `app/entrar/page.tsx`

- [ ] **Step 1: Replace select with Combobox**

```tsx
// app/entrar/page.tsx
// Add import
import Combobox from "@/app/components/Combobox";

// In EnterPage return
        <label className="block text-sm font-bold">Nombre
          <Combobox options={participants} />
        </label>
```

### Task 3: Verification and Commit

- [ ] **Step 1: Run TypeScript check**
Run: `npx tsc --noEmit`

- [ ] **Step 2: Commit**
```bash
git add app/components/Combobox.tsx app/entrar/page.tsx
git commit -m "feat: replace select with combobox for user selection"
```
