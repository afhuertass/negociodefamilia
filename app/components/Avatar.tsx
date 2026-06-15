'use client';

import { useState } from 'react';

export default function Avatar({ participantId, name }: { participantId: string; name: string }) {
  const [src, setSrc] = useState(`/avatars/${participantId}.jpeg`);
  const [error, setError] = useState(false);

  const handleError = () => {
    if (!error) {
      setSrc("/avatars/fallback.jpeg");
      setError(true);
    }
  };

  return (
    <img
      src={src}
      alt={name}
      className="h-10 w-10 rounded-full object-cover"
      onError={handleError}
    />
  );
}
