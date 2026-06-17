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
