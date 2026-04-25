export interface SessionAccessInput {
  id?: string | null;
  meetUrl?: string | null;
  meetingLink?: string | null;
}

export interface SessionAccess {
  href: string;
  isExternal: boolean;
  label: string;
  variant: 'external' | 'native-placeholder';
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

  return null;
}

