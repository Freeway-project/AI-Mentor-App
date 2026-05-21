export interface SessionAccessInput {
  id?: string | null;
  livekitRoomName?: string | null;
  meetUrl?: string | null;
  meetingLink?: string | null;
}

export interface SessionAccess {
  href: string;
  isExternal: boolean;
  label: string;
  variant: 'external' | 'native';
}

function normalizeLink(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getSessionAccess(session: SessionAccessInput): SessionAccess | null {
  const externalHref = normalizeLink(session.meetUrl) ?? normalizeLink(session.meetingLink);

  if (externalHref) {
    return {
      href: externalHref,
      isExternal: true,
      label: externalHref.includes('meet.google.com') ? 'Join Google Meet' : 'Join Meeting',
      variant: 'external',
    };
  }

  if (normalizeLink(session.livekitRoomName) && session.id) {
    return {
      href: `/video/${session.id}`,
      isExternal: false,
      label: 'Open Session Room',
      variant: 'native',
    };
  }

  return null;
}

export function hasLegacySessionRoom(session: SessionAccessInput) {
  return Boolean(normalizeLink(session.livekitRoomName));
}
